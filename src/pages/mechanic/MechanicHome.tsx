import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useMechanicRequests } from '@/hooks/useMechanicRequests';
import { useMechanicProfile } from '@/hooks/useMechanicProfile';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Bell, 
  MapPin, 
  Star, 
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Loader2
} from 'lucide-react';

const MechanicHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requests, loading: requestsLoading, acceptRequest, declineRequest } = useMechanicRequests();
  const [isOnline, setIsOnline] = useState(true);

  const stats = {
    todayEarnings: 1250,
    weeklyEarnings: 8500,
    todayJobs: 3,
    rating: 4.8,
    totalJobs: 234,
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-mechanic text-primary-foreground safe-area-inset-top">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-primary-foreground/30"
              />
              <div>
                <p className="text-xs text-primary-foreground/70">Good Morning</p>
                <p className="font-semibold">Mechanic</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
              <Bell className="w-5 h-5" />
            </Button>
          </div>

          {/* Online Toggle */}
          <div className="flex items-center justify-between bg-primary-foreground/10 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
              <div>
                <p className="font-medium">{isOnline ? 'You are Online' : 'You are Offline'}</p>
                <p className="text-xs text-primary-foreground/70">
                  {isOnline ? 'Accepting new job requests' : 'Not accepting requests'}
                </p>
              </div>
            </div>
            <Switch
              checked={isOnline}
              onCheckedChange={setIsOnline}
              className="data-[state=checked]:bg-success"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6">
        {/* Stats */}
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-success" />
              </div>
              <span className="text-xs text-muted-foreground">Today's Earnings</span>
            </div>
            <p className="text-2xl font-bold text-foreground">₹{stats.todayEarnings.toLocaleString()}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Jobs Completed</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.todayJobs}</p>
          </div>
        </section>

        {/* Incoming Requests - REAL-TIME */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Incoming Requests</h2>
              {requests.length > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {requests.length}
                </span>
              )}
            </div>
          </div>

          {requestsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-card rounded-xl p-6 border border-border/50 text-center">
              <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No incoming requests</p>
              <p className="text-xs text-muted-foreground mt-1">New requests will appear here in real-time</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req, index) => (
                <div
                  key={req.id}
                  className="bg-card rounded-xl p-4 border-2 border-warning/30 animate-fade-in shadow-md"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${req.user_name}`}
                        alt={req.user_name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <h3 className="font-semibold text-foreground">{req.user_name}</h3>
                        <p className="text-xs text-muted-foreground">{getTimeAgo(req.created_at)}</p>
                      </div>
                    </div>
                    <span className="bg-warning/10 text-warning text-xs font-medium px-2 py-1 rounded-lg capitalize">
                      {req.service_type}
                    </span>
                  </div>

                  {req.issue_description && (
                    <p className="text-sm text-muted-foreground mb-3 bg-muted/50 rounded-lg p-2">
                      "{req.issue_description}"
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {req.latitude.toFixed(3)}°, {req.longitude.toFixed(3)}°
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => declineRequest(req.id)}
                    >
                      Decline
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => acceptRequest(req.id)}
                    >
                      Accept Job
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/mechanic/earnings')}
              className="w-full flex items-center justify-between p-4 bg-card rounded-xl border border-border/50 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-success" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">View Earnings</p>
                  <p className="text-xs text-muted-foreground">Check your earnings & payouts</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={() => navigate('/mechanic/jobs')}
              className="w-full flex items-center justify-between p-4 bg-card rounded-xl border border-border/50 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Job History</p>
                  <p className="text-xs text-muted-foreground">View past completed jobs</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MechanicHome;
