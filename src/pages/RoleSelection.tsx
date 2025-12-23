import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Car, Wrench, ArrowRight, Shield, Clock, MapPin } from 'lucide-react';
import autoaidLogo from '@/assets/autoaid-logo.png';

const RoleSelection: React.FC = () => {
  const navigate = useNavigate();
  const { setRole } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Trigger animations after mount
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleRoleSelect = (role: 'user' | 'mechanic') => {
    setRole(role);
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-primary-dark flex flex-col overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className={`safe-area-inset-top py-8 px-4 relative z-10 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
        <div className="flex flex-col items-center justify-center">
          <img 
            src={autoaidLogo} 
            alt="AutoAid" 
            className="h-20 w-auto rounded-xl drop-shadow-2xl"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-8 flex flex-col justify-center relative z-10">
        <div className={`text-center mb-8 transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-xl font-semibold text-white mb-2">
            Choose Your Account Type
          </h2>
          <p className="text-white/70 text-sm">
            Select how you want to use AutoAid
          </p>
        </div>

        {/* Role Cards */}
        <div className="space-y-4 max-w-md mx-auto w-full">
          {/* Vehicle Owner Card */}
          <button
            onClick={() => handleRoleSelect('user')}
            className={`w-full text-left p-5 rounded-3xl bg-white/10 backdrop-blur-lg border border-white/20 
              transition-all duration-500 delay-300 hover:bg-white/20 hover:scale-[1.02] hover:border-white/40
              active:scale-[0.98] group
              ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Car className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">
                  I am a Vehicle Owner
                </h3>
                <p className="text-sm text-white/70">
                  Find verified mechanics near you for instant repairs
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-white/60 mt-2 group-hover:translate-x-1 transition-transform" />
            </div>
            
            {/* Features */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-white/90 backdrop-blur">
                🚗 Quick Booking
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-white/90 backdrop-blur">
                📍 Live Tracking
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-white/90 backdrop-blur">
                💳 Secure Payments
              </span>
            </div>
          </button>

          {/* Mechanic Card */}
          <button
            onClick={() => handleRoleSelect('mechanic')}
            className={`w-full text-left p-5 rounded-3xl bg-white/10 backdrop-blur-lg border border-white/20 
              transition-all duration-500 delay-500 hover:bg-white/20 hover:scale-[1.02] hover:border-white/40
              active:scale-[0.98] group
              ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-mechanic-orange/30 flex items-center justify-center group-hover:bg-mechanic-orange/40 transition-colors">
                <Wrench className="w-7 h-7 text-mechanic-orange" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">
                  I am a Mechanic
                </h3>
                <p className="text-sm text-white/70">
                  Join our network and earn by helping vehicle owners
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-white/60 mt-2 group-hover:translate-x-1 transition-transform" />
            </div>
            
            {/* Features */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-mechanic-orange/20 text-xs text-white/90 backdrop-blur">
                💰 Earn More
              </span>
              <span className="px-3 py-1 rounded-full bg-mechanic-orange/20 text-xs text-white/90 backdrop-blur">
                📊 Track Earnings
              </span>
              <span className="px-3 py-1 rounded-full bg-mechanic-orange/20 text-xs text-white/90 backdrop-blur">
                ⭐ Build Reputation
              </span>
            </div>
          </button>
        </div>

        {/* Trust Badges */}
        <div className={`mt-10 max-w-md mx-auto w-full transition-all duration-700 delay-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center justify-center gap-6 text-white/60">
            <div className="flex items-center gap-1.5 text-xs">
              <Shield className="w-4 h-4 text-green-400" />
              <span>Verified</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Clock className="w-4 h-4 text-blue-300" />
              <span>24/7</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <MapPin className="w-4 h-4 text-red-400" />
              <span>Pan India</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`py-4 px-4 text-center safe-area-inset-bottom relative z-10 transition-all duration-700 delay-[800ms] ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <p className="text-xs text-white/50">
          By continuing, you agree to our{' '}
          <button className="text-white/70 underline">Terms</button>
          {' '}and{' '}
          <button className="text-white/70 underline">Privacy Policy</button>
        </p>
      </footer>
    </div>
  );
};

export default RoleSelection;
