import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { ArrowLeft, Loader2, Eye, EyeOff, CheckCircle, Mail, KeyRound, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import autoaidLogo from '@/assets/autoaid-logo.png';

// Validation schemas
const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address').max(255);
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters').max(72);
const nameSchema = z.string().trim().min(2, 'Name must be at least 2 characters').max(100);

type AuthStep = 'choose-mode' | 'login-email' | 'login-password' | 'signup-email' | 'signup-details' | 'verification' | 'forgot-password' | 'reset-password' | 'reset-sent' | 'reset-expired';

// Google Icon Component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, role, isLoading: authLoading } = useAuth();
  
  const [step, setStep] = useState<AuthStep>('choose-mode');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(false);
  const [backendReachable, setBackendReachable] = useState<boolean | null>(null);

  // Verify backend reachability on mount (no longer clears tokens aggressively)
  useEffect(() => {
    const init = async () => {
      // Health check — allow generous timeout for slow mobile networks
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/?apikey=${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          { method: 'GET', signal: controller.signal }
        );
        clearTimeout(timeout);
        setBackendReachable(res.ok || res.status === 401 || res.status === 406);
      } catch {
        // If health check fails, still allow login — the Supabase SDK
        // uses its own fetch path which may work even if direct fetch doesn't
        setBackendReachable(true);
      }
    };
    init();
  }, []);
  useEffect(() => {
    const mode = searchParams.get('mode');
    const type = searchParams.get('type');
    const errorCode = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    // Handle error from reset link (expired/invalid)
    if (errorCode) {
      const desc = errorDescription?.toLowerCase() || '';
      if (desc.includes('expired') || desc.includes('invalid') || errorCode === 'access_denied') {
        setStep('reset-expired');
        // Clear error params
        setSearchParams({}, { replace: true });
        return;
      }
    }

    // Handle email confirmation - sign out and show login
    if (type === 'signup' || type === 'email_change') {
      // Sign out to prevent auto-login, user must enter password
      supabase.auth.signOut().then(() => {
        setStep('login-email');
        toast.success('Email verified successfully! Please log in.');
        setSearchParams({}, { replace: true });
      });
      return;
    }

    // Listen for auth events to detect recovery (password reset)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User clicked the reset link and Supabase has exchanged the token
        setIsResetMode(true);
        setStep('reset-password');
        // Clear URL params
        setSearchParams({}, { replace: true });
      }
    });

    // Check if we're coming from a reset link (mode=reset in URL)
    if (mode === 'reset') {
      // The actual reset handling happens via PASSWORD_RECOVERY event
      // This is just a fallback indicator
      setIsResetMode(true);
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [searchParams, setSearchParams]);

  // Redirect if already authenticated (but not in reset mode)
  useEffect(() => {
    if (!authLoading && isAuthenticated && !isResetMode && !isCheckingRole && step !== 'reset-password') {
      if (role === 'user') {
        navigate('/user', { replace: true });
      } else if (role === 'mechanic') {
        navigate('/mechanic', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, authLoading, role, navigate, isResetMode, isCheckingRole, step]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const validateEmail = (value: string): boolean => {
    try {
      emailSchema.parse(value);
      setError('');
      return true;
    } catch (e) {
      if (e instanceof z.ZodError) {
        setError(e.errors[0].message);
      }
      return false;
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    
    if (!validateEmail(normalizedEmail)) return;
    
    setIsLoading(true);
    setError('');

    try {
      // Try to sign in with a dummy password to check if user exists
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: '__check_user_exists_dummy_pwd_' + Date.now(),
      });

      if (error) {
        const msg = error.message.toLowerCase();
        const isNetworkError = msg.includes('failed to fetch') || msg.includes('networkerror') || ((error as any).__isAuthError && (error as any).status === 0);

        if (isNetworkError) {
          console.error('Email check network error:', error.message);
          setError('Unable to reach server. Please refresh the page and try again.');
        } else if (msg.includes('invalid login credentials')) {
          setIsExistingUser(true);
          setStep('login-password');
        } else if (msg.includes('email not confirmed')) {
          setIsExistingUser(true);
          setStep('verification');
          setResendCooldown(30);
          toast.info('Please verify your email to continue.');
        } else if (msg.includes('user not found') || msg.includes('no user')) {
          setIsExistingUser(false);
          setStep('signup-details');
        } else if (msg.includes('too many requests') || msg.includes('rate limit')) {
          setError('Too many attempts. Please wait a moment.');
        } else {
          setIsExistingUser(false);
          setStep('signup-details');
        }
      } else {
        toast.success('Welcome back!');
      }
    } catch (err: any) {
      console.error('Email check exception:', err);
      setError('Unable to reach server. Please refresh the page and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        setError(e.errors[0].message);
        return;
      }
    }

    setIsLoading(true);
    setIsCheckingRole(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        const isNetworkError = msg.includes('failed to fetch') || msg.includes('networkerror') || ((error as any).__isAuthError && (error as any).status === 0);

        console.error('Login auth error:', { message: error.message, status: (error as any).status, name: error.name });
        setPassword('');

        if (isNetworkError) {
          setError('Unable to reach server. Please refresh the page and try again.');
        } else if (msg.includes('invalid login credentials')) {
          if (isExistingUser) {
            setError('Incorrect password. Please try again.');
          } else {
            setError('No account found with this email.');
            setTimeout(() => setStep('signup-details'), 1500);
          }
        } else if (msg.includes('email not confirmed') || msg.includes('email not verified')) {
          setStep('verification');
          setResendCooldown(0);
          setError('Please verify your email to continue. Check your inbox for the verification link.');
        } else if (msg.includes('too many requests') || msg.includes('rate limit')) {
          setError('Too many login attempts. Please wait a moment and try again.');
        } else if (msg.includes('user not found')) {
          setError('No account found with this email.');
          setTimeout(() => setStep('signup-details'), 1500);
        } else {
          setError(`Login failed: ${error.message}`);
        }
        return;
      }

      // Check if user's registered role matches the selected role
      if (role) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const userId = userData.user.id;

          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .maybeSingle();

          if (roleData && roleData.role !== role) {
            await supabase.auth.signOut();
            setPassword('');
            const otherRole = roleData.role === 'user' ? 'Vehicle Owner' : 'Mechanic';
            setError(`This email is registered as a ${otherRole}. Please use a different email or select the correct role.`);
            return;
          }

          // If no role in user_roles yet, determine from mechanics table
          if (!roleData) {
            const { data: mechanicData } = await supabase
              .from('mechanics')
              .select('id')
              .eq('user_id', userId)
              .maybeSingle();

            const actualRole = mechanicData ? 'mechanic' : 'user';

            if (actualRole !== role) {
              await supabase.auth.signOut();
              setPassword('');
              const otherRole = actualRole === 'user' ? 'Vehicle Owner' : 'Mechanic';
              setError(`This email is registered as a ${otherRole}. Please use a different email or select the correct role.`);
              return;
            }

            // Assign the correct role
            await supabase.from('user_roles').insert({
              user_id: userId,
              role: actualRole as 'user' | 'mechanic',
            });
          }
        }
      }

      setIsCheckingRole(false);
      toast.success('Welcome back!');
    } catch (err: any) {
      console.error('Login exception:', err);
      setPassword('');
      setError(`Login failed: ${err?.message || 'Please refresh the page and try again.'}`);
    } finally {
      setIsLoading(false);
      setIsCheckingRole(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      nameSchema.parse(fullName);
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        setError(e.errors[0].message);
        return;
      }
    }

    setIsLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: { full_name: fullName.trim() },
        },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        
        if (msg.includes('already registered')) {
          setError('This email is already registered');
          setIsExistingUser(true);
          setTimeout(() => setStep('login-password'), 1500);
        } else if (msg.includes('weak')) {
          setError('Please use a stronger password');
        } else if (msg.includes('too many requests')) {
          setError('Too many attempts. Please wait a moment.');
        } else {
          setError('Unable to create account. Please try again.');
        }
        return;
      }

      // Save the user's role before signing out
      if (data.user && role) {
        await supabase.from('user_roles').insert({
          user_id: data.user.id,
          role: role as 'user' | 'mechanic',
        });
      }

      // Always sign out after signup to prevent any auto-login
      await supabase.auth.signOut();

      if (data.user) {
        setStep('verification');
        setResendCooldown(30);
        toast.success('Account created! Check your email to verify before logging in.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    
    if (!validateEmail(normalizedEmail)) return;
    
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('too many requests') || msg.includes('rate limit')) {
          setError('Too many attempts. Please wait a moment.');
        } else {
          setError('Unable to send reset link. Please try again.');
        }
        return;
      }

      setStep('reset-sent');
      setResendCooldown(60);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password
    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        setError(e.errors[0].message);
        return;
      }
    }

    // Check passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('same password') || msg.includes('different password')) {
          setError('Please choose a different password from your previous one.');
        } else if (msg.includes('weak')) {
          setError('Please use a stronger password.');
        } else if (msg.includes('session') || msg.includes('expired') || msg.includes('invalid')) {
          setStep('reset-expired');
        } else {
          setError('Unable to reset password. Please try again.');
        }
        return;
      }

      // Sign out to clear session and force fresh login
      await supabase.auth.signOut();
      
      // Reset all state
      setIsResetMode(false);
      setPassword('');
      setConfirmPassword('');
      setEmail('');
      
      toast.success('Password reset successful! Please log in with your new password.');
      setStep('choose-mode');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth?type=signup`,
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes('already confirmed')) {
          toast.success('Your email is already verified! You can log in now.');
          setStep('login-email');
          return;
        }
        setError(error.message);
        return;
      }



      setResendCooldown(30);
      toast.success('Verification email sent!');
    } catch (err) {
      setError('Failed to resend. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendResetLink = async () => {
    if (resendCooldown > 0 || !email) return;
    
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });

      if (error) {
        setError('Unable to resend. Please try again.');
        return;
      }

      setResendCooldown(60);
      toast.success('Password reset link sent!');
    } catch (err) {
      setError('Failed to resend. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        console.error('Google sign-in error:', error);
        if (error.message.includes('provider is not enabled')) {
          setError('Google sign-in is not configured. Please use email instead.');
        } else {
          setError('Unable to sign in with Google. Please try again.');
        }
        toast.error('Google sign-in failed');
      }
    } catch (err) {
      console.error('Google sign-in exception:', err);
      setError('Something went wrong. Please try again.');
      toast.error('Google sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setError('');
    setPassword('');
    setConfirmPassword('');
    
    if (step === 'login-password') {
      setStep('login-email');
    } else if (step === 'login-email' || step === 'signup-email') {
      setStep('choose-mode');
    } else if (step === 'signup-details') {
      setStep('signup-email');
    } else if (step === 'verification') {
      setStep('choose-mode');
    } else if (step === 'forgot-password' || step === 'reset-sent') {
      setStep('login-password');
    } else if (step === 'reset-password') {
      // Can't go back from reset - must complete or get new link
      setStep('choose-mode');
      setIsResetMode(false);
    } else if (step === 'reset-expired') {
      setStep('choose-mode');
    } else {
      navigate('/');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="safe-area-inset-top p-4">
        <button
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 px-6 pb-8 flex flex-col max-w-md mx-auto w-full">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <img src={autoaidLogo} alt="AutoAid" className="h-10 w-10" />
          <span className="text-2xl font-bold text-foreground">AutoAid</span>
        </div>

        {/* Choose Mode Step */}
        {step === 'choose-mode' && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-1">
              Welcome to AutoAid
            </h1>
            <p className="text-primary font-medium italic mb-2">
              Because Breakdowns Can't Wait
            </p>
            <p className="text-muted-foreground mb-8">
              Get roadside assistance anytime, anywhere
            </p>

            {/* Google Sign In Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-14 text-lg font-medium mb-4 border-2 hover:bg-muted/50"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <GoogleIcon />
                  <span className="ml-3">Continue with Google</span>
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Login / Signup Buttons */}
            <Button
              type="button"
              className="w-full h-14 text-lg font-semibold mb-3"
              onClick={() => setStep('login-email')}
            >
              Log in with Email
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-14 text-lg font-semibold border-2"
              onClick={() => setStep('signup-email')}
            >
              Create Account
            </Button>

            {error && <p className="text-destructive text-sm mt-4 text-center">{error}</p>}
          </div>
        )}

        {/* Login Email Step */}
        {step === 'login-email' && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Log in
            </h1>
            <p className="text-muted-foreground mb-8">
              Enter your email to continue
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!validateEmail(email.trim().toLowerCase())) return;
              setStep('login-password');
            }}>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className={`h-14 text-lg px-4 ${error ? 'border-destructive' : ''}`}
                autoComplete="email"
                autoFocus
                disabled={isLoading}
              />
              {error && <p className="text-destructive text-sm mt-2">{error}</p>}

              <div className="mt-6">
                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-semibold"
                  disabled={!email.trim()}
                >
                  Continue
                </Button>
              </div>
            </form>

            <p className="text-center text-muted-foreground mt-6">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setStep('signup-email')}
                className="text-primary font-medium hover:underline"
              >
                Sign up
              </button>
            </p>
          </div>
        )}

        {/* Signup Email Step */}
        {step === 'signup-email' && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Create account
            </h1>
            <p className="text-muted-foreground mb-8">
              Enter your email to get started
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!validateEmail(email.trim().toLowerCase())) return;
              setStep('signup-details');
            }}>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className={`h-14 text-lg px-4 ${error ? 'border-destructive' : ''}`}
                autoComplete="email"
                autoFocus
                disabled={isLoading}
              />
              {error && <p className="text-destructive text-sm mt-2">{error}</p>}

              <div className="mt-6">
                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-semibold"
                  disabled={!email.trim()}
                >
                  Continue
                </Button>
              </div>
            </form>

            <p className="text-center text-muted-foreground mt-6">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setStep('login-email')}
                className="text-primary font-medium hover:underline"
              >
                Log in
              </button>
            </p>
          </div>
        )}

        {/* Login Password Step */}
        {step === 'login-password' && (
          <form onSubmit={handleLogin} className="flex-1 flex flex-col animate-fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back
            </h1>
            <p className="text-muted-foreground mb-8">
              Enter your password for {email}
            </p>

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className={`h-14 text-lg px-4 pr-12 ${error ? 'border-destructive' : ''}`}
                autoFocus
                autoComplete="current-password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {error && <p className="text-destructive text-sm mt-2">{error}</p>}

            <button
              type="button"
              onClick={() => {
                setError('');
                setStep('forgot-password');
              }}
              className="text-primary text-sm font-medium mt-4 self-start hover:underline"
            >
              Forgot password?
            </button>

            <div className="mt-auto pt-8">
              <Button
                type="submit"
                className="w-full h-14 text-lg font-semibold"
                disabled={!password || isLoading}
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign in'}
              </Button>
            </div>
          </form>
        )}

        {/* Forgot Password Step */}
        {step === 'forgot-password' && (
          <form onSubmit={handleForgotPassword} className="flex-1 flex flex-col animate-fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Reset your password
            </h1>
            <p className="text-muted-foreground mb-8">
              Enter your email and we'll send you a reset link
            </p>

            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              className={`h-14 text-lg px-4 ${error ? 'border-destructive' : ''}`}
              autoFocus
              autoComplete="email"
              disabled={isLoading}
            />
            {error && <p className="text-destructive text-sm mt-2">{error}</p>}

            <div className="mt-auto pt-8">
              <Button
                type="submit"
                className="w-full h-14 text-lg font-semibold"
                disabled={!email.trim() || isLoading}
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send reset link'}
              </Button>
            </div>
          </form>
        )}

        {/* Reset Link Sent Step */}
        {step === 'reset-sent' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Mail className="h-10 w-10 text-primary" />
            </div>

            <h1 className="text-2xl font-bold text-foreground mb-3">
              Check your email
            </h1>

            <p className="text-muted-foreground mb-2">
              Password reset link sent to
            </p>
            <p className="font-semibold text-foreground mb-6">
              {email}
            </p>

            <div className="bg-muted/50 rounded-2xl p-5 mb-6 w-full max-w-sm">
              <div className="flex items-start gap-3 text-left">
                <KeyRound className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Reset your password</p>
                  <p>Click the link in the email to set a new password. The link will open directly in this app.</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Didn't receive the email? Check your spam folder.
            </p>

            <Button
              variant="outline"
              onClick={handleResendResetLink}
              disabled={resendCooldown > 0 || isLoading}
              className="w-full max-w-sm h-12"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : resendCooldown > 0 ? (
                `Resend in ${resendCooldown}s`
              ) : (
                'Resend reset link'
              )}
            </Button>

            <button
              onClick={() => {
                setStep('choose-mode');
                setError('');
              }}
              className="text-primary text-sm font-medium mt-4 hover:underline"
            >
              Back to login
            </button>
          </div>
        )}

        {/* Reset Password Step (from email link) */}
        {step === 'reset-password' && (
          <form onSubmit={handleResetPassword} className="flex-1 flex flex-col animate-fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Set new password
            </h1>
            <p className="text-muted-foreground mb-8">
              Create a strong password for your account
            </p>

            <div className="space-y-4">
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className={`h-14 text-lg px-4 pr-12 ${error ? 'border-destructive' : ''}`}
                  autoFocus
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  className={`h-14 text-lg px-4 pr-12 ${error ? 'border-destructive' : ''}`}
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && <p className="text-destructive text-sm mt-2">{error}</p>}

            <p className="text-muted-foreground text-xs mt-4">
              Password must be at least 6 characters
            </p>

            <div className="mt-auto pt-8">
              <Button
                type="submit"
                className="w-full h-14 text-lg font-semibold"
                disabled={!password || !confirmPassword || isLoading}
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Reset password'}
              </Button>
            </div>
          </form>
        )}

        {/* Reset Link Expired Step */}
        {step === 'reset-expired' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>

            <h1 className="text-2xl font-bold text-foreground mb-3">
              Link expired
            </h1>

            <p className="text-muted-foreground mb-6 max-w-sm">
              This password reset link has expired or is invalid. Please request a new one.
            </p>

            <Button
              onClick={() => {
                setStep('forgot-password');
                setError('');
              }}
              className="w-full max-w-sm h-12"
            >
              Request new link
            </Button>

            <button
              onClick={() => {
                setStep('choose-mode');
                setError('');
              }}
              className="text-primary text-sm font-medium mt-4 hover:underline"
            >
              Back to login
            </button>
          </div>
        )}

        {/* Signup Details Step */}
        {step === 'signup-details' && (
          <form onSubmit={handleSignup} className="flex-1 flex flex-col animate-fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Create your account
            </h1>
            <p className="text-muted-foreground mb-8">
              Enter your details for {email}
            </p>

            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setError('');
                }}
                className="h-14 text-lg px-4"
                autoFocus
                autoComplete="name"
                disabled={isLoading}
              />

              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className={`h-14 text-lg px-4 pr-12 ${error ? 'border-destructive' : ''}`}
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            {error && <p className="text-destructive text-sm mt-2">{error}</p>}

            <p className="text-muted-foreground text-xs mt-4">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>

            <div className="mt-auto pt-8">
              <Button
                type="submit"
                className="w-full h-14 text-lg font-semibold"
                disabled={!fullName.trim() || !password || isLoading}
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create account'}
              </Button>
            </div>
          </form>
        )}

        {/* Verification Step */}
        {step === 'verification' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>

            <h1 className="text-2xl font-bold text-foreground mb-3">
              Verify your email
            </h1>

            <p className="text-muted-foreground mb-2">
              We sent a verification link to
            </p>
            <p className="font-semibold text-foreground mb-6">
              {email}
            </p>

            <div className="bg-muted/50 rounded-2xl p-5 mb-6 w-full max-w-sm">
              <div className="flex items-start gap-3 text-left">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Check your inbox</p>
                  <p>Click the link in the email to verify your account, then come back here to sign in.</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Didn't receive the email? Check your spam folder.
            </p>

            <Button
              variant="outline"
              onClick={handleResendVerification}
              disabled={resendCooldown > 0 || isLoading}
              className="w-full max-w-sm h-12"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : resendCooldown > 0 ? (
                `Resend in ${resendCooldown}s`
              ) : (
                'Resend verification email'
              )}
            </Button>

            <button
              onClick={() => {
                setStep('login-password');
                setError('');
              }}
              className="text-primary text-sm font-medium mt-4 hover:underline"
            >
              I've verified, let me sign in
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Auth;
