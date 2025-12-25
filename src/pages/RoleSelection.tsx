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
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f1a] via-[#0d1526] to-[#000000] flex flex-col overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-1/4 -left-48 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-500/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Header */}
      <header className={`safe-area-inset-top pt-12 pb-6 px-6 relative z-10 transition-all duration-1000 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-12'}`}>
        <div className="flex flex-col items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-white/10 rounded-2xl blur-xl scale-150" />
            <img 
              src={autoaidLogo} 
              alt="AutoAid" 
              className="h-16 w-auto rounded-2xl relative z-10"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-5 pb-6 flex flex-col justify-center relative z-10">
        <div className={`text-center mb-10 transition-all duration-1000 ease-out delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">
            Choose Your Account Type
          </h1>
          <p className="text-white/50 text-sm font-light tracking-wide">
            Select how you want to use AutoAid
          </p>
        </div>

        {/* Role Cards */}
        <div className="space-y-5 max-w-md mx-auto w-full">
          {/* Vehicle Owner Card */}
          <button
            onClick={() => handleRoleSelect('user')}
            className={`w-full text-left p-6 rounded-[28px] 
              bg-gradient-to-br from-white/[0.08] to-white/[0.02]
              backdrop-blur-xl border border-white/[0.08]
              shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]
              transition-all duration-500 ease-out delay-300 
              hover:bg-gradient-to-br hover:from-white/[0.12] hover:to-white/[0.04]
              hover:scale-[1.02] hover:border-white/[0.15]
              hover:shadow-[0_16px_48px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]
              active:scale-[0.98] group
              ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-16'}`}
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/30 to-blue-600/20 
                flex items-center justify-center 
                group-hover:from-blue-500/40 group-hover:to-blue-600/30 
                transition-all duration-300 shadow-lg shadow-blue-500/10">
                <Car className="w-7 h-7 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white mb-1 tracking-tight">
                  I am a Vehicle Owner
                </h3>
                <p className="text-sm text-white/50 font-light leading-relaxed">
                  Find verified mechanics near you for instant repairs
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center 
                group-hover:bg-white/[0.1] transition-all duration-300">
                <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all duration-300" />
              </div>
            </div>
            
            {/* Features */}
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300/90 font-medium">
                🚗 Quick Booking
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300/90 font-medium">
                📍 Live Tracking
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300/90 font-medium">
                💳 Secure Payments
              </span>
            </div>
          </button>

          {/* Mechanic Card */}
          <button
            onClick={() => handleRoleSelect('mechanic')}
            className={`w-full text-left p-6 rounded-[28px] 
              bg-gradient-to-br from-white/[0.08] to-white/[0.02]
              backdrop-blur-xl border border-white/[0.08]
              shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]
              transition-all duration-500 ease-out delay-500 
              hover:bg-gradient-to-br hover:from-white/[0.12] hover:to-white/[0.04]
              hover:scale-[1.02] hover:border-orange-500/20
              hover:shadow-[0_16px_48px_rgba(0,0,0,0.5),0_0_0_1px_rgba(249,115,22,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]
              active:scale-[0.98] group
              ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-16'}`}
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/30 to-orange-600/20 
                flex items-center justify-center 
                group-hover:from-orange-500/40 group-hover:to-orange-600/30 
                transition-all duration-300 shadow-lg shadow-orange-500/10">
                <Wrench className="w-7 h-7 text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white mb-1 tracking-tight">
                  I am a Mechanic
                </h3>
                <p className="text-sm text-white/50 font-light leading-relaxed">
                  Join our network and earn by helping vehicle owners
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center 
                group-hover:bg-white/[0.1] transition-all duration-300">
                <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all duration-300" />
              </div>
            </div>
            
            {/* Features */}
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300/90 font-medium">
                💰 Earn More
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 font-medium">
                📊 Track Earnings
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-300/90 font-medium">
                ⭐ Build Reputation
              </span>
            </div>
          </button>
        </div>

        {/* Trust Badges */}
        <div className={`mt-12 max-w-md mx-auto w-full transition-all duration-1000 ease-out delay-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center justify-center gap-8">
            <div className="flex items-center gap-2 text-xs text-white/40">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="font-medium">Verified</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <span className="font-medium">24/7</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-red-400" />
              </div>
              <span className="font-medium">Pan India</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`py-6 px-6 text-center safe-area-inset-bottom relative z-10 transition-all duration-1000 ease-out delay-[900ms] ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <p className="text-xs text-white/30 font-light">
          By continuing, you agree to our{' '}
          <button className="text-white/50 hover:text-white/70 underline underline-offset-2 transition-colors">Terms</button>
          {' '}and{' '}
          <button className="text-white/50 hover:text-white/70 underline underline-offset-2 transition-colors">Privacy Policy</button>
        </p>
      </footer>
    </div>
  );
};

export default RoleSelection;
