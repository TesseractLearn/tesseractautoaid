import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMechanicProfile } from '@/hooks/useMechanicProfile';
import { Loader2, TrendingUp, Wallet, Calendar } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface DayEarning {
  date: string;
  jobs: number;
  earnings: number;
}

const EarningsTab: React.FC = () => {
  const { data: mechanic } = useMechanicProfile();
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mechanic) return;
    const fetchEarnings = async () => {
      setLoading(true);
      const since = subDays(new Date(), 30).toISOString();
      const { data } = await supabase
        .from('bookings')
        .select('id, final_price, estimated_price, completed_at, created_at, status')
        .eq('mechanic_id', mechanic.id)
        .eq('status', 'completed')
        .gte('created_at', since)
        .order('created_at', { ascending: false });

      setCompletedJobs(data || []);
      setLoading(false);
    };
    fetchEarnings();
  }, [mechanic?.id]);

  const totalEarnings = useMemo(() => {
    return completedJobs.reduce((sum, j) => sum + Number(j.final_price || j.estimated_price || 0), 0);
  }, [completedJobs]);

  const todayEarnings = useMemo(() => {
    const todayStart = startOfDay(new Date()).toISOString();
    return completedJobs
      .filter(j => j.completed_at && j.completed_at >= todayStart)
      .reduce((sum, j) => sum + Number(j.final_price || j.estimated_price || 0), 0);
  }, [completedJobs]);

  const chartData: DayEarning[] = useMemo(() => {
    const days: Record<string, DayEarning> = {};
    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'MMM dd');
      days[d] = { date: d, jobs: 0, earnings: 0 };
    }
    completedJobs.forEach(j => {
      const d = format(new Date(j.completed_at || j.created_at), 'MMM dd');
      if (days[d]) {
        days[d].jobs += 1;
        days[d].earnings += Number(j.final_price || j.estimated_price || 0);
      }
    });
    return Object.values(days);
  }, [completedJobs]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">This Month</span>
          </div>
          <p className="text-xl font-bold text-foreground">₹{totalEarnings.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{completedJobs.length} jobs</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-success" />
            <span className="text-xs text-muted-foreground">Today</span>
          </div>
          <p className="text-xl font-bold text-foreground">₹{todayEarnings.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {completedJobs.filter(j => j.completed_at && j.completed_at >= startOfDay(new Date()).toISOString()).length} jobs
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Last 7 Days</h3>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Earnings']}
              />
              <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown List */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Daily Breakdown</h3>
        <div className="space-y-2">
          {chartData.slice().reverse().map(d => (
            <div key={d.date} className="flex items-center justify-between bg-secondary/50 rounded-lg px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{d.date}</p>
                <p className="text-xs text-muted-foreground">{d.jobs} job{d.jobs !== 1 ? 's' : ''}</p>
              </div>
              <p className="font-semibold text-foreground">₹{d.earnings.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EarningsTab;
