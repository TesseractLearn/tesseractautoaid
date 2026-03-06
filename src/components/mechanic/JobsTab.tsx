import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMechanicProfile } from '@/hooks/useMechanicProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, MapPin, Clock, CheckCircle2, Navigation, Star, Briefcase, XCircle, MapPinCheck, Wrench, QrCode, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import CancelJobDialog from '@/components/CancelJobDialog';
import { calculatePricing } from '@/lib/pricing';

interface Job {
  id: string;
  service_type: string;
  status: string;
  address: string | null;
  final_price: number | null;
  estimated_price: number | null;
  created_at: string;
  completed_at: string | null;
  latitude: number;
  longitude: number;
  issue_description: string | null;
  labor_cost: number | null;
  parts_cost: number | null;
  tax_amount: number | null;
  platform_fee: number | null;
  mechanic_quote: number | null;
  payment_status: string | null;
}

const statusColors: Record<string, string> = {
  accepted: 'bg-primary/10 text-primary',
  on_way: 'bg-warning/10 text-warning',
  reached: 'bg-accent/10 text-accent',
  repair_in_progress: 'bg-accent/10 text-accent',
  in_progress: 'bg-accent/10 text-accent',
  completed: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
  mechanic_cancelled: 'bg-destructive/10 text-destructive',
};

const statusLabels: Record<string, string> = {
  accepted: 'Accepted',
  on_way: 'On the Way',
  reached: 'Reached',
  repair_in_progress: 'Repairing',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  mechanic_cancelled: 'Cancelled',
};

type Filter = 'active' | 'today' | 'week' | 'month';

const JobsTab: React.FC = () => {
  const { data: mechanic } = useMechanicProfile();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('active');
  const [completing, setCompleting] = useState<string | null>(null);
  const [cancellingJobId, setCancellingJobId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [qrJobId, setQrJobId] = useState<string | null>(null);

  const handleCancel = async (jobId: string, reason: string) => {
    try {
      const { error } = await supabase.from('bookings').update({
        status: 'mechanic_cancelled',
        issue_description: `[MECHANIC_CANCELLED] ${reason}`,
      }).eq('id', jobId);
      if (error) throw error;
      toast.success('Job cancelled');
      setCancellingJobId(null);
      fetchJobs();
    } catch {
      toast.error('Failed to cancel job');
      throw new Error('cancel failed');
    }
  };

  useEffect(() => {
    if (!mechanic) return;
    fetchJobs();

    const channel = supabase
      .channel('mechanic-jobs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchJobs())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [mechanic?.id, filter]);

  const fetchJobs = async () => {
    if (!mechanic) return;
    setLoading(true);

    let query = supabase
      .from('bookings')
      .select('id, service_type, status, address, final_price, estimated_price, created_at, completed_at, latitude, longitude, issue_description, labor_cost, parts_cost, tax_amount, platform_fee, mechanic_quote, payment_status')
      .eq('mechanic_id', mechanic.id)
      .order('created_at', { ascending: false });

    if (filter === 'active') {
      query = query.in('status', ['accepted', 'on_way', 'reached', 'repair_in_progress', 'in_progress', 'completed']).not('payment_status', 'eq', 'released');
    } else {
      const now = new Date();
      let since: Date;
      if (filter === 'today') {
        since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (filter === 'week') {
        since = new Date(now.getTime() - 7 * 86400000);
      } else {
        since = new Date(now.getTime() - 30 * 86400000);
      }
      query = query.gte('created_at', since.toISOString());
    }

    const { data } = await query.limit(50);
    setJobs(data || []);
    setLoading(false);
  };

  const handleStatusUpdate = async (jobId: string, newStatus: string) => {
    setUpdatingStatus(jobId);
    try {
      const { error } = await supabase.from('bookings').update({
        status: newStatus,
      }).eq('id', jobId);
      if (error) throw error;
      const labels: Record<string, string> = {
        on_way: 'On your way! Customer notified.',
        reached: 'Marked as reached!',
        repair_in_progress: 'Repair started!',
      };
      toast.success(labels[newStatus] || 'Status updated');
      fetchJobs();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleComplete = async (jobId: string, actualHours: number, partsCost: number) => {
    setCompleting(jobId);
    try {
      const hourlyRate = Number(mechanic?.hourly_rate) || 200;
      const pricing = calculatePricing(hourlyRate, actualHours, partsCost);
      
      const { error } = await supabase.from('bookings').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        actual_hours: actualHours,
        parts_cost: partsCost,
        labor_cost: pricing.laborCost,
        mechanic_quote: pricing.subtotal,
        platform_fee: pricing.platformFee,
        tax_amount: pricing.tax,
        final_price: pricing.total,
      }).eq('id', jobId);
      if (error) throw error;
      toast.success(`Job completed! Invoice: ₹${pricing.total}`);
      fetchJobs();
    } catch {
      toast.error('Failed to update job');
    } finally {
      setCompleting(null);
    }
  };

  const activeStatuses = ['accepted', 'on_way', 'reached', 'repair_in_progress', 'in_progress'];
  const activeJobs = jobs.filter(j => activeStatuses.includes(j.status) || (j.status === 'completed' && j.payment_status !== 'released'));
  const historyJobs = jobs.filter(j => !activeStatuses.includes(j.status) && !(j.status === 'completed' && j.payment_status !== 'released'));

  const qrJob = qrJobId ? jobs.find(j => j.id === qrJobId) : null;

  return (
    <div className="space-y-5 pb-8">
      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {([
          { key: 'active', label: 'Active' },
          { key: 'today', label: 'Today' },
          { key: 'week', label: 'This Week' },
          { key: 'month', label: 'This Month' },
        ] as { key: Filter; label: string }[]).map(f => (
          <Button
            key={f.key}
            variant={filter === f.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f.key)}
            className="text-xs whitespace-nowrap"
          >
            {f.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No jobs found</p>
        </div>
      ) : (
        <>
          {/* Active Jobs */}
           {filter === 'active' && activeJobs.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Active Jobs ({activeJobs.length})</h3>
              {activeJobs.map(job => (
                 <JobCard
                   key={job.id}
                   job={job}
                   onComplete={handleComplete}
                   onStatusUpdate={handleStatusUpdate}
                   completing={completing}
                   updatingStatus={updatingStatus}
                   onCancelClick={() => setCancellingJobId(job.id)}
                   onShowQr={() => setQrJobId(job.id)}
                   hourlyRate={Number(mechanic?.hourly_rate) || 200}
                 />
              ))}
            </div>
          )}

          <CancelJobDialog
            open={!!cancellingJobId}
            onOpenChange={(open) => { if (!open) setCancellingJobId(null); }}
            onConfirm={(reason) => handleCancel(cancellingJobId!, reason)}
            role="mechanic"
          />

          {/* History */}
          {(filter !== 'active' || (filter === 'active' && historyJobs.length > 0)) && (
            <div className="space-y-3">
              {filter === 'active' && historyJobs.length > 0 && (
                <h3 className="text-sm font-semibold text-foreground mt-4">Recent Completed</h3>
              )}
              {(filter === 'active' ? historyJobs.slice(0, 5) : historyJobs).map(job => (
                <JobCard key={job.id} job={job} onComplete={handleComplete} onStatusUpdate={handleStatusUpdate} completing={completing} updatingStatus={updatingStatus} hourlyRate={Number(mechanic?.hourly_rate) || 200} />
              ))}
            </div>
          )}
        </>
      )}

      {/* QR Code Dialog */}
      <Dialog open={!!qrJobId} onOpenChange={(open) => { if (!open) setQrJobId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Accept Payment</DialogTitle>
          </DialogHeader>
          {qrJob && (
            <div className="space-y-4 text-center">
              <div className="bg-muted rounded-xl p-6 flex flex-col items-center gap-3">
                <div className="bg-white p-4 rounded-xl">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=autoaid@upi%26pn=AutoAid%26am=${qrJob.final_price || qrJob.mechanic_quote || 0}%26cu=INR%26tn=Booking-${qrJob.id.slice(0, 8)}`}
                    alt="Payment QR Code"
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-sm text-muted-foreground">Scan to pay via UPI</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold text-foreground">₹{Number(qrJob.final_price || qrJob.mechanic_quote || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Booking</span>
                  <span className="text-foreground font-mono text-xs">{qrJob.id.slice(0, 8)}</span>
                </div>
              </div>
              <Button className="w-full" onClick={async () => {
                try {
                  await supabase.from('bookings').update({ payment_status: 'paid_cash' }).eq('id', qrJob.id);
                  toast.success('Payment received!');
                  setQrJobId(null);
                  fetchJobs();
                } catch {
                  toast.error('Failed to update payment');
                }
              }}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark as Paid
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const JobCard: React.FC<{
  job: Job;
  onComplete: (id: string, hours: number, partsCost: number) => void;
  onStatusUpdate: (id: string, status: string) => void;
  completing: string | null;
  updatingStatus: string | null;
  onCancelClick?: () => void;
  onShowQr?: () => void;
  hourlyRate: number;
}> = ({ job, onComplete, onStatusUpdate, completing, updatingStatus, onCancelClick, onShowQr, hourlyRate }) => {
  const isActive = ['accepted', 'on_way', 'reached', 'repair_in_progress', 'in_progress'].includes(job.status);
  const isCompletedUnpaid = job.status === 'completed' && job.payment_status !== 'released' && job.payment_status !== 'paid_cash';
  const price = job.final_price || job.estimated_price;
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [hours, setHours] = useState(2);
  const [partsCost, setPartsCost] = useState(0);

  const preview = calculatePricing(hourlyRate, hours, partsCost);
  const isUpdating = updatingStatus === job.id;

  // Determine the next action button based on current status
  const getActionButton = () => {
    if (isUpdating) {
      return (
        <Button size="sm" className="text-xs h-8" disabled>
          <Loader2 className="w-3 h-3 animate-spin mr-1" />
          Updating...
        </Button>
      );
    }

    switch (job.status) {
      case 'accepted':
        return (
          <Button size="sm" className="text-xs h-8 bg-warning hover:bg-warning/90 text-warning-foreground" onClick={() => onStatusUpdate(job.id, 'on_way')}>
            <Navigation className="w-3 h-3 mr-1" />
            On My Way
          </Button>
        );
      case 'on_way':
        return (
          <Button size="sm" className="text-xs h-8" variant="default" onClick={() => onStatusUpdate(job.id, 'reached')}>
            <MapPinCheck className="w-3 h-3 mr-1" />
            Reached
          </Button>
        );
      case 'reached':
        return (
          <Button size="sm" className="text-xs h-8 bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => onStatusUpdate(job.id, 'repair_in_progress')}>
            <Wrench className="w-3 h-3 mr-1" />
            Start Repair
          </Button>
        );
      case 'repair_in_progress':
      case 'in_progress':
        return !showCompleteForm ? (
          <Button size="sm" className="text-xs h-8 bg-success hover:bg-success/90 text-white" onClick={() => setShowCompleteForm(true)}>
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Complete
          </Button>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className={`bg-card rounded-xl border p-4 ${isActive || isCompletedUnpaid ? 'border-primary/30' : 'border-border'}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-sm text-foreground capitalize">
            {job.service_type.replace('_', ' ')}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(job.created_at), 'dd MMM yyyy, hh:mm a')}
          </p>
        </div>
        <Badge className={`text-[10px] ${statusColors[job.status] || 'bg-muted text-muted-foreground'}`}>
          {statusLabels[job.status] || job.status}
        </Badge>
      </div>

      {job.issue_description && !job.issue_description.startsWith('[MECHANIC_CANCELLED]') && (
        <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2 mb-2">
          {job.issue_description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {job.address && (
            <span className="flex items-center gap-1 truncate max-w-[150px]">
              <MapPin className="w-3 h-3 shrink-0" /> {job.address}
            </span>
          )}
          {price != null && (
            <span className="font-medium text-foreground">₹{Number(price).toLocaleString()}</span>
          )}
        </div>

        <div className="flex gap-2 items-center">
          {isActive && getActionButton()}
          {isActive && !['repair_in_progress', 'in_progress'].includes(job.status) && (
            <Button size="sm" variant="ghost" className="text-xs h-8 text-destructive" onClick={onCancelClick}>
              <XCircle className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Completed but unpaid — Accept Payment */}
      {isCompletedUnpaid && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="bg-success/10 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-sm font-semibold text-success">Job Completed</span>
            </div>
            <p className="text-xs text-muted-foreground">Collect payment from the customer</p>
          </div>
          <Button size="sm" className="w-full h-9" onClick={onShowQr}>
            <QrCode className="w-4 h-4 mr-2" />
            Accept Payment — ₹{Number(job.final_price || job.mechanic_quote || 0).toLocaleString()}
          </Button>
        </div>
      )}

      {/* Completion form with pricing */}
      {showCompleteForm && (
        <div className="mt-3 pt-3 border-t border-border space-y-3 animate-fade-in">
          <p className="text-xs font-semibold text-foreground">Final Invoice Details</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">Hours Worked</label>
              <Input type="number" value={hours} onChange={(e) => setHours(Math.max(0.5, Number(e.target.value)))} min={0.5} step={0.5} className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Parts Cost (₹)</label>
              <Input type="number" value={partsCost} onChange={(e) => setPartsCost(Math.max(0, Number(e.target.value)))} min={0} className="h-8 text-sm" />
            </div>
          </div>
          <div className="bg-secondary/50 rounded-lg p-2 text-xs space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Labor (₹{hourlyRate}/hr × {hours}hr)</span><span>₹{preview.laborCost}</span></div>
            {partsCost > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Parts</span><span>₹{partsCost}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">GST (18%)</span><span>₹{preview.tax}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Platform Fee (15%)</span><span>₹{preview.platformFee}</span></div>
            <div className="flex justify-between font-semibold border-t border-border pt-1"><span>User Pays</span><span>₹{preview.total}</span></div>
            <div className="flex justify-between text-success"><span>You Receive</span><span>₹{preview.mechanicShare}</span></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 text-xs h-8" onClick={() => onComplete(job.id, hours, partsCost)} disabled={completing === job.id}>
              {completing === job.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
              Confirm ₹{preview.total}
            </Button>
            <Button size="sm" variant="ghost" className="text-xs h-8" onClick={() => setShowCompleteForm(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsTab;
