import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
  Power
} from 'lucide-react';
import autoaidLogo from '@/assets/autoaid-logo.png';

const MechanicHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);

  const stats = {
    todayEarnings: 1250,
    weeklyEarnings: 8500,
    todayJobs: 3,
    pendingRequests: 2,
    rating: 4.8,
    totalJobs: 234,
  };

  const pendingJobs = [
    {
      id: 1,
      userName: 'Rahul Sharma',
      service: 'Puncture Repair',
      vehicle: 'Maruti Swift',
      distance: '1.2 km',
      eta: '8 min',
      price: 350,
    },
    {
      id: 2,
      userName: 'Priya Patel',
      service: 'Battery Jumpstart',
      vehicle: 'Honda City',
      distance: '2.5 km',
      eta: '15 min',
      price: 500,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-mechanic text-primary-foreground safe-area-inset-top">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=raju`}
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-primary-foreground/30"
              />
              <div>
                <p className="text-xs text-primary-foreground/70">Good Morning</p>
                <p className="font-semibold">Raju Kumar</p>
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
        {/* Today's Stats */}
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-success" />
              </div>
              <span className="text-xs text-muted-foreground">Today's Earnings</span>
            </div>
            <p className="text-2xl font-bold text-foreground">₹{stats.todayEarnings.toLocaleString()}</p>
            <p className="text-xs text-success flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              +12% from yesterday
            </p>
          </div>
          
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Jobs Completed</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.todayJobs}</p>
            <p className="text-xs text-muted-foreground mt-1">{stats.totalJobs} total jobs</p>
          </div>
        </section>

        {/* Weekly Earnings Card */}
        <section className="bg-gradient-primary rounded-2xl p-5 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-foreground/80">This Week's Earnings</p>
              <p className="text-3xl font-bold mt-1">₹{stats.weeklyEarnings.toLocaleString()}</p>
              <p className="text-xs text-primary-foreground/70 mt-2">7 jobs completed</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 mb-2">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-bold">{stats.rating}</span>
              </div>
              <p className="text-xs text-primary-foreground/70">Rating</p>
            </div>
          </div>
        </section>

        {/* Pending Requests */}
        {pendingJobs.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">Incoming Requests</h2>
                <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingJobs.length}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              {pendingJobs.map((job, index) => (
                <div
                  key={job.id}
                  className="bg-card rounded-xl p-4 border-2 border-warning/30 animate-fade-in shadow-md"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${job.userName}`}
                        alt={job.userName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <h3 className="font-semibold text-foreground">{job.userName}</h3>
                        <p className="text-xs text-muted-foreground">{job.vehicle}</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-foreground">₹{job.price}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 text-warning" />
                      {job.service}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {job.distance}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {job.eta}
                    </span>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1">
                      Decline
                    </Button>
                    <Button variant="success" className="flex-1">
                      Accept Job
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

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
