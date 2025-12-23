import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import splashBackground from '@/assets/splash-background.jpg';
import autoaidLogo from '@/assets/autoaid-logo.png';

const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        if (user) {
          navigate('/role-selection');
        } else {
          navigate('/auth');
        }
      }, 500);
    }, 2500);

    return () => clearTimeout(timer);
  }, [user, navigate]);

  return (
    <div 
      className={`fixed inset-0 flex flex-col items-center justify-center bg-primary transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{
        backgroundImage: `url(${splashBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay for better text visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/70 to-primary/90" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-8">
        {/* Logo */}
        <div className="mb-8 animate-fade-in">
          <img 
            src={autoaidLogo} 
            alt="AutoAid" 
            className="w-32 h-32 object-contain drop-shadow-2xl"
          />
        </div>
        
        {/* App Name */}
        <h1 className="text-5xl font-bold text-white mb-4 animate-fade-in tracking-tight">
          AutoAid
        </h1>
        
        {/* Tagline */}
        <p className="text-xl text-white/90 font-medium animate-slide-up italic">
          "Because Breakdowns Can't Wait."
        </p>
        
        {/* Loading indicator */}
        <div className="mt-16 animate-pulse">
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
