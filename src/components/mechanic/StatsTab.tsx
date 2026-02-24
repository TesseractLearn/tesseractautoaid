import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMechanicProfile } from '@/hooks/useMechanicProfile';
import { Loader2, Star, Clock, TrendingUp, Target, BarChart3, Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format, subDays } from 'date-fns';

const COLORS = ['hsl(217,91%,50%)', 'hsl(25,95%,53%)', 'hsl(142,76%,36%)', 'hsl(38,92%,50%)', 'hsl(199,89%,48%)'];

const StatsTab: React.FC = () => {
  const { data: mechanic } = useMechanicProfile();
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mechanic) return;
    const fetchAllJobs = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('bookings')
        .select('id, service_type, status, created_at, completed_at, final_price, estimated_price')
        .eq('mechanic_id', mechanic.id)
        .order('created_at', { ascending: false })
        .limit(500);
      setAllJobs(data || []);
      setLoading(false);
    };
    fetchAllJobs();
  }, [mechanic?.id]);

  const stats = useMemo(() => {
    const completed = allJobs.filter(j => j.status === 'completed');
    const cancelled = allJobs.filter(j => j.status === 'cancelled');
    const totalEarnings = completed.reduce((s, j) => s + Number(j.final_price || j.estimated_price || 0), 0);
    const successRate = allJobs.length > 0 ? ((completed.length / allJobs.length) * 100) : 0;

    return {
      totalJobs: allJobs.length,
      completedJobs: completed.length,
      cancelledJobs: cancelled.length,
      totalEarnings,
      successRate,
      avgResponseTime: mechanic ? Number((mechanic as any).avg_response_time || 0) : 0,
      avgEta: mechanic ? Number((mechanic as any).avg_eta || 0) : 0,
      rating: mechanic ? Number(mechanic.rating || 0) : 0,
    };
  }, [allJobs, mechanic]);

  // Service distribution for pie chart
  const serviceDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    allJobs.forEach(j => {
      const type = j.service_type || 'general';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value,
    }));
  }, [allJobs]);

  // Weekly trend line chart
  const weeklyTrend = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      days[format(subDays(new Date(), i), 'EEE')] = 0;
    }
    allJobs.forEach(j => {
      const d = format(new Date(j.created_at), 'EEE');
      if (days[d] !== undefined) days[d] += 1;
    });
    return Object.entries(days).map(([day, jobs]) => ({ day, jobs }));
  }, [allJobs]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { icon: <Target className="w-5 h-5 text-primary" />, label: 'Total Jobs', value: stats.totalJobs.toString() },
    { icon: <Clock className="w-5 h-5 text-warning" />, label: 'Avg Response', value: `${stats.avgResponseTime.toFixed(1)} min` },
    { icon: <TrendingUp className="w-5 h-5 text-accent" />, label: 'Avg ETA', value: `${stats.avgEta.toFixed(1)} min` },
    { icon: <BarChart3 className="w-5 h-5 text-success" />, label: 'Success Rate', value: `${stats.successRate.toFixed(0)}%` },
    { icon: <Star className="w-5 h-5 text-yellow-500" />, label: 'Rating', value: stats.rating.toFixed(1) },
    { icon: <Users className="w-5 h-5 text-mechanic" />, label: 'Earnings', value: `₹${stats.totalEarnings.toLocaleString()}` },
  ];

  return (
    <div className="space-y-5 pb-8">
      {/* Stat grid */}
      <div className="grid grid-cols-3 gap-3">
        {statCards.map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-3 text-center">
            <div className="flex justify-center mb-1.5">{s.icon}</div>
            <p className="text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Weekly Trend */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Weekly Jobs Trend</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line type="monotone" dataKey="jobs" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Service Distribution */}
      {serviceDistribution.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Service Distribution</h3>
          <div className="flex items-center gap-4">
            <div className="h-36 w-36 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={55}
                    dataKey="value"
                    stroke="none"
                  >
                    {serviceDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {serviceDistribution.map((s, i) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-foreground capitalize">{s.name}</span>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsTab;
