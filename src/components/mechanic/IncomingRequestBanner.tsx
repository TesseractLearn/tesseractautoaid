import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMechanicRequests } from '@/hooks/useMechanicRequests';
import { Bell, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const IncomingRequestBanner: React.FC = () => {
  const navigate = useNavigate();
  const { requests } = useMechanicRequests();
  const prevCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play notification sound when new requests arrive
  useEffect(() => {
    if (requests.length > prevCountRef.current && requests.length > 0) {
      // Play a notification beep using Web Audio API
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.5);
        
        // Second beep
        setTimeout(() => {
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          osc2.frequency.value = 1100;
          osc2.type = 'sine';
          gain2.gain.setValueAtTime(0.3, audioCtx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
          osc2.start(audioCtx.currentTime);
          osc2.stop(audioCtx.currentTime + 0.5);
        }, 200);
      } catch (e) {
        // Audio not supported
      }
    }
    prevCountRef.current = requests.length;
  }, [requests.length]);

  if (requests.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 safe-area-inset-top">
      <button
        onClick={() => navigate('/mechanic/home')}
        className="w-full bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3 shadow-lg animate-pulse"
      >
        <div className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {requests.length}
          </span>
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold">
            {requests.length === 1 ? '1 new job request!' : `${requests.length} new job requests!`}
          </p>
          <p className="text-xs text-primary-foreground/80">Tap to view and accept</p>
        </div>
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

export default IncomingRequestBanner;
