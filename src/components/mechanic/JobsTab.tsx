import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMechanicProfile } from '@/hooks/useMechanicProfile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Clock, CheckCircle2, Navigation, Star, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
}

const statusColors: Record<string, string> = {
  accepted: 'bg-primary/10 text-primary',
  mechanic_arriving: 'bg-warning/10 text-warning',
  in_progress: 'bg-accent/10 text-accent',
  completed: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
};

const statusLabels: Record<string, string> = {
  accepted: 'Accepted',
  mechanic_arriving: 'Arriving',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

type Filter = 'active' | 'today' | 'week' | 'month';

const JobsTab: React.FC = () => {
  const { data: mechanic } = useMechanicProfile();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('active');
  const [completing, setCompleting] = useState<string | null>(null);

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
      .select('id, service_type, status, address, final_price, estimated_price, created_at, completed_at, latitude, longitude, issue_description')
      .eq('mechanic_id', mechanic.id)
      .order('created_at', { ascending: false });

    if (filter === 'active') {
      query = query.in('status', ['accepted', 'mechanic_arriving', 'in_progress']);
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

  const handleComplete = async (jobId: string) => {
    setCompleting(jobId);
    try {
      const { error } = await supabase.from('bookings').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      }).eq('id', jobId);
      if (error) throw error;
      toast.success('Job marked as completed!');
      fetchJobs();
    } catch {
      toast.error('Failed to update job');
    } finally {
      setCompleting(null);
    }
  };

  const activeJobs = jobs.filter(j => ['accepted', 'mechanic_arriving', 'in_progress'].includes(j.status));
  const historyJobs = jobs.filter(j => !['accepted', 'mechanic_arriving', 'in_progress'].includes(j.status));

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
                <JobCard key={job.id} job={job} onComplete={handleComplete} completing={completing} />
              ))}
            </div>
          )}

          {/* History */}
          {(filter !== 'active' || (filter === 'active' && historyJobs.length > 0)) && (
            <div className="space-y-3">
              {filter === 'active' && historyJobs.length > 0 && (
                <h3 className="text-sm font-semibold text-foreground mt-4">Recent Completed</h3>
              )}
              {(filter === 'active' ? historyJobs.slice(0, 5) : historyJobs).map(job => (
                <JobCard key={job.id} job={job} onComplete={handleComplete} completing={completing} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const JobCard: React.FC<{
  job: Job;
  onComplete: (id: string) => void;
  completing: string | null;
}> = ({ job, onComplete, completing }) => {
  const isActive = ['accepted', 'mechanic_arriving', 'in_progress'].includes(job.status);
  const price = job.final_price || job.estimated_price;

  return (
    <div className={`bg-card rounded-xl border p-4 ${isActive ? 'border-primary/30' : 'border-border'}`}>
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

      {job.issue_description && (
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

        {isActive && job.status === 'in_progress' && (
          <Button
            size="sm"
            className="text-xs h-8"
            onClick={() => onComplete(job.id)}
            disabled={completing === job.id}
          >
            {completing === job.id ? (
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
            ) : (
              <CheckCircle2 className="w-3 h-3 mr-1" />
            )}
            Complete
          </Button>
        )}
      </div>
    </div>
  );
};

export default JobsTab;
