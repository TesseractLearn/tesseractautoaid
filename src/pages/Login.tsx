import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Mail, CheckCircle, Loader2 } from 'lucide-react';
import autoaidLogo from '@/assets/autoaid-logo.png';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [step, setStep] = useState<'email' | 'sent'>('email');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}${role === 'mechanic' ? '/mechanic' : '/user'}`;
      
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (authError) {
        setError(authError.message);
        toast.error(authError.message);
      } else {
        setStep('sent');
        toast.success('Magic link sent! Check your email.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}${role === 'mechanic' ? '/mechanic' : '/user'}`;
      
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (authError) {
        toast.error(authError.message);
      } else {
        toast.success('Magic link resent! Check your email.');
      }
    } catch (err) {
      toast.error('Failed to resend. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="safe-area-inset-top py-4 px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => step === 'sent' ? setStep('email') : navigate('/')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <img src={autoaidLogo} alt="AutoAid" className="h-8 w-8" />
            <span className="font-semibold text-foreground">
              {role === 'mechanic' ? 'Mechanic Login' : 'Login'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-8 flex flex-col">
        <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
          {step === 'email' ? (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Enter your email
                </h1>
                <p className="text-muted-foreground text-sm">
                  We'll send you a magic link to sign in
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl text-base"
                    disabled={isLoading}
                  />
                  {error && (
                    <p className="text-destructive text-sm mt-2">{error}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Magic Link'
                  )}
                </Button>
              </form>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Check your email
                </h1>
                <p className="text-muted-foreground text-sm">
                  We've sent a magic link to
                </p>
                <p className="text-foreground font-medium mt-1">
                  {email}
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-secondary/50 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Click the link in the email to sign in. The link will expire in 1 hour.
                  </p>
                </div>

                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the email?
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleResend}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Resending...
                      </>
                    ) : (
                      'Resend Magic Link'
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setStep('email')}
                    className="w-full"
                  >
                    Use a different email
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="mt-auto pt-8">
            <div className="bg-secondary/50 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
