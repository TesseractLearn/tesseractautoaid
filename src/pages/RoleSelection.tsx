import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Car, Wrench, ArrowRight, Shield, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import autoaidLogo from '@/assets/autoaid-logo.png';

const RoleSelection: React.FC = () => {
  const navigate = useNavigate();
  const { setRole } = useAuth();

  const handleRoleSelect = (role: 'user' | 'mechanic') => {
    setRole(role);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="safe-area-inset-top py-6 px-4">
        <div className="flex items-center justify-center gap-3">
          <img src={autoaidLogo} alt="AutoAid" className="h-12 w-12" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">AutoAid</h1>
            <p className="text-xs text-muted-foreground">Because Breakdowns Can't Wait</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-8 flex flex-col justify-center">
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Choose Your Account Type
          </h2>
          <p className="text-muted-foreground text-sm">
            Select how you want to use AutoAid
          </p>
        </div>

        {/* Role Cards */}
        <div className="space-y-4 max-w-md mx-auto w-full">
          {/* Vehicle Owner Card */}
          <button
            onClick={() => handleRoleSelect('user')}
            className="role-card role-card-user w-full text-left animate-fade-in stagger-1"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-foreground/20 flex items-center justify-center">
                <Car className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-primary-foreground mb-1">
                  I am a Vehicle Owner
                </h3>
                <p className="text-sm text-primary-foreground/80">
                  Find verified mechanics near you for instant repairs
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-primary-foreground/60 mt-2" />
            </div>
            
            {/* Features */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-primary-foreground/20 text-xs text-primary-foreground">
                🚗 Quick Booking
              </span>
              <span className="px-3 py-1 rounded-full bg-primary-foreground/20 text-xs text-primary-foreground">
                📍 Live Tracking
              </span>
              <span className="px-3 py-1 rounded-full bg-primary-foreground/20 text-xs text-primary-foreground">
                💳 Secure Payments
              </span>
            </div>
          </button>

          {/* Mechanic Card */}
          <button
            onClick={() => handleRoleSelect('mechanic')}
            className="role-card role-card-mechanic w-full text-left animate-fade-in stagger-2"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-foreground/20 flex items-center justify-center">
                <Wrench className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-primary-foreground mb-1">
                  I am a Mechanic
                </h3>
                <p className="text-sm text-primary-foreground/80">
                  Join our network and earn by helping vehicle owners
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-primary-foreground/60 mt-2" />
            </div>
            
            {/* Features */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-primary-foreground/20 text-xs text-primary-foreground">
                💰 Earn More
              </span>
              <span className="px-3 py-1 rounded-full bg-primary-foreground/20 text-xs text-primary-foreground">
                📊 Track Earnings
              </span>
              <span className="px-3 py-1 rounded-full bg-primary-foreground/20 text-xs text-primary-foreground">
                ⭐ Build Reputation
              </span>
            </div>
          </button>
        </div>

        {/* Trust Badges */}
        <div className="mt-10 max-w-md mx-auto w-full animate-fade-in stagger-3">
          <div className="flex items-center justify-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-1.5 text-xs">
              <Shield className="w-4 h-4 text-success" />
              <span>Verified Mechanics</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Clock className="w-4 h-4 text-primary" />
              <span>24/7 Available</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <MapPin className="w-4 h-4 text-accent" />
              <span>Pan India</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 text-center safe-area-inset-bottom">
        <p className="text-xs text-muted-foreground">
          By continuing, you agree to our{' '}
          <button className="text-primary underline">Terms of Service</button>
          {' '}and{' '}
          <button className="text-primary underline">Privacy Policy</button>
        </p>
      </footer>
    </div>
  );
};

export default RoleSelection;
