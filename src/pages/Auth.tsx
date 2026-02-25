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

// Validation
const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address').max(255);
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters').max(72);
const nameSchema = z.string().trim().min(2, 'Name must be at least 2 characters').max(100);

type AuthStep =
  | 'choose-mode'
  | 'login-email'
  | 'login-password'
  | 'signup-email'
  | 'signup-details'
  | 'verification'
  | 'forgot-password'
  | 'reset-password'
  | 'reset-sent'
  | 'reset-expired';

// Helper: detect network errors from Supabase
const isNetworkError = (error: any): boolean => {
  const msg = (error?.message || '').toLowerCase();
  return msg.includes('failed to fetch') || msg.includes('networkerror') ||
    msg.includes('network') || msg.includes('timeout') ||
    (error?.__isAuthError && error?.status === 0);
};

const NETWORK_ERROR_MSG = 'Unable to reach server. Please check your internet connection and try again.';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
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
  const [isResetMode, setIsResetMode] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(false);

  // Handle URL params (email confirm, password reset)
  useEffect(() => {
    const type = searchParams.get('type');
    const errorCode = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const mode = searchParams.get('mode');

    if (errorCode) {
      const desc = (errorDescription || '').toLowerCase();
      if (desc.includes('expired') || desc.includes('invalid') || errorCode === 'access_denied') {
        setStep('reset-expired');
        setSearchParams({}, { replace: true });
        return;
      }
    }

    if (type === 'signup' || type === 'email_change') {
      supabase.auth.signOut().then(() => {
        setStep('login-email');
        toast.success('Email verified! Please log in.');
        setSearchParams({}, { replace: true });
      });
      return;
    }

    if (mode === 'reset') {
      setIsResetMode(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResetMode(true);
        setStep('reset-password');
        setSearchParams({}, { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [searchParams, setSearchParams]);

  // Redirect if authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && !isResetMode && !isCheckingRole && step !== 'reset-password') {
      console.log('[Auth] Redirect check - role:', role, 'isAuthenticated:', isAuthenticated);
      if (role === 'user') navigate('/user', { replace: true });
      else if (role === 'mechanic') navigate('/mechanic', { replace: true });
      else navigate('/role-selection', { replace: true });
    }
  }, [isAuthenticated, authLoading, role, navigate, isResetMode, isCheckingRole, step]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  // --- Auth Handlers ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try { passwordSchema.parse(password); } catch (e: any) {
      if (e instanceof z.ZodError) { setError(e.errors[0].message); return; }
    }

    setIsLoading(true);
    setIsCheckingRole(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      console.log('[Login] Attempting sign in for:', normalizedEmail);
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail, password,
      });

      console.log('[Login] Result:', { user: signInData?.user?.id, session: !!signInData?.session, error: signInError?.message });

      if (signInError) {
        setPassword('');
        if (isNetworkError(signInError)) {
          setError(NETWORK_ERROR_MSG);
        } else {
          const msg = signInError.message.toLowerCase();
          if (msg.includes('invalid login credentials')) {
            setError('Incorrect email or password. Please try again.');
          } else if (msg.includes('email not confirmed')) {
            setStep('verification');
            setResendCooldown(0);
            setError('Please verify your email first.');
          } else if (msg.includes('too many requests') || msg.includes('rate limit')) {
            setError('Too many attempts. Please wait a moment.');
          } else {
            setError(`Login failed: ${signInError.message}`);
          }
        }
        return;
      }

      // Role verification
      if (role) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const userId = userData.user.id;
          const { data: roleData } = await supabase
            .from('user_roles').select('role').eq('user_id', userId).maybeSingle();

          if (roleData && roleData.role !== role) {
            await supabase.auth.signOut();
            setPassword('');
            const otherRole = roleData.role === 'user' ? 'Vehicle Owner' : 'Mechanic';
            setError(`This email is registered as a ${otherRole}. Please select the correct role.`);
            return;
          }

          if (!roleData) {
            const { data: mechData } = await supabase
              .from('mechanics').select('id').eq('user_id', userId).maybeSingle();
            const actualRole = mechData ? 'mechanic' : 'user';
            if (actualRole !== role) {
              await supabase.auth.signOut();
              setPassword('');
              const otherRole = actualRole === 'user' ? 'Vehicle Owner' : 'Mechanic';
              setError(`This email is registered as a ${otherRole}. Please select the correct role.`);
              return;
            }
            await supabase.from('user_roles').insert({
              user_id: userId, role: actualRole as 'user' | 'mechanic',
            });
          }
        }
      }

      setIsCheckingRole(false);
      toast.success('Welcome back!');
    } catch (err: any) {
      setPassword('');
      if (isNetworkError(err)) setError(NETWORK_ERROR_MSG);
      else setError(`Login failed: ${err?.message || 'Please try again.'}`);
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
    } catch (e: any) {
      if (e instanceof z.ZodError) { setError(e.errors[0].message); return; }
    }

    setIsLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?type=signup`,
          data: { full_name: fullName.trim() },
        },
      });

      if (signUpError) {
        if (isNetworkError(signUpError)) { setError(NETWORK_ERROR_MSG); return; }
        const msg = signUpError.message.toLowerCase();
        if (msg.includes('already registered')) {
          setError('This email is already registered');
          setTimeout(() => setStep('login-password'), 1500);
        } else if (msg.includes('weak')) {
          setError('Please use a stronger password');
        } else if (msg.includes('too many requests')) {
          setError('Too many attempts. Please wait.');
        } else {
          setError('Unable to create account. Please try again.');
        }
        return;
      }

      // Assign role
      if (data?.user && role) {
        try {
          await supabase.from('user_roles').insert({
            user_id: data.user.id, role: role as 'user' | 'mechanic',
          });
        } catch {} // Non-critical — will be assigned on next login if fails
      }

      // Sign out after signup (user must verify email first)
      await supabase.auth.signOut().catch(() => {});

      setStep('verification');
      setResendCooldown(30);
      toast.success('Account created! Check your email to verify.');
    } catch (err: any) {
      if (isNetworkError(err)) setError(NETWORK_ERROR_MSG);
      else setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    try { emailSchema.parse(normalizedEmail); } catch (e: any) {
      if (e instanceof z.ZodError) { setError(e.errors[0].message); return; }
    }

    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });
      if (error) {
        if (isNetworkError(error)) { setError(NETWORK_ERROR_MSG); return; }
        setError('Unable to send reset link. Please try again.');
        return;
      }
      setStep('reset-sent');
      setResendCooldown(60);
    } catch (err: any) {
      if (isNetworkError(err)) setError(NETWORK_ERROR_MSG);
      else setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try { passwordSchema.parse(password); } catch (e: any) {
      if (e instanceof z.ZodError) { setError(e.errors[0].message); return; }
    }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('same password')) setError('Please choose a different password.');
        else if (msg.includes('session') || msg.includes('expired')) setStep('reset-expired');
        else setError('Unable to reset password. Please try again.');
        return;
      }
      await supabase.auth.signOut();
      setIsResetMode(false);
      setPassword('');
      setConfirmPassword('');
      setEmail('');
      toast.success('Password reset! Please log in with your new password.');
      setStep('choose-mode');
    } catch (err: any) {
      if (isNetworkError(err)) setError(NETWORK_ERROR_MSG);
      else setError('Something went wrong. Please try again.');
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
        options: { emailRedirectTo: `${window.location.origin}/auth?type=signup` },
      });
      if (error) {
        if (error.message.toLowerCase().includes('already confirmed')) {
          toast.success('Email already verified! You can log in.');
          setStep('login-email');
          return;
        }
        setError(error.message);
        return;
      }
      setResendCooldown(30);
      toast.success('Verification email sent!');
    } catch { setError('Failed to resend. Please try again.'); }
    finally { setIsLoading(false); }
  };

  const handleResendResetLink = async () => {
    if (resendCooldown > 0 || !email) return;
    setIsLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });
      if (error) { setError('Unable to resend. Please try again.'); return; }
      setResendCooldown(60);
      toast.success('Reset link sent!');
    } catch { setError('Failed to resend. Please try again.'); }
    finally { setIsLoading(false); }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
          queryParams: { access_type: 'offline', prompt: 'select_account' },
        },
      });
      if (error) {
        if (error.message.includes('provider is not enabled'))
          setError('Google sign-in is not configured. Please use email.');
        else setError('Unable to sign in with Google. Please try again.');
      }
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setIsLoading(false); }
  };

  const handleEmailSubmit = async (isLogin: boolean) => {
    const normalizedEmail = email.trim().toLowerCase();
    try { emailSchema.parse(normalizedEmail); } catch (e: any) {
      if (e instanceof z.ZodError) { setError(e.errors[0].message); return; }
    }
    setError('');

    if (isLogin) {
      // For login, just go to password step — the actual login call will tell us if user exists
      setStep('login-password');
    } else {
      setStep('signup-details');
    }
  };

  const handleBack = () => {
    setError('');
    setPassword('');
    setConfirmPassword('');
    const backMap: Partial<Record<AuthStep, AuthStep>> = {
      'login-password': 'login-email',
      'login-email': 'choose-mode',
      'signup-email': 'choose-mode',
      'signup-details': 'signup-email',
      'verification': 'choose-mode',
      'forgot-password': 'login-password',
      'reset-sent': 'login-password',
      'reset-password': 'choose-mode',
      'reset-expired': 'choose-mode',
    };
    const next = backMap[step];
    if (next) {
      if (step === 'reset-password') setIsResetMode(false);
      setStep(next);
    } else {
      navigate('/');
    }
  };

  // --- Loading state ---
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // --- Render ---
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="safe-area-inset-top p-4">
        <button onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
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

        {/* Choose Mode */}
        {step === 'choose-mode' && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-1">Welcome to AutoAid</h1>
            <p className="text-primary font-medium italic mb-2">Because Breakdowns Can't Wait</p>
            <p className="text-muted-foreground mb-8">Get roadside assistance anytime, anywhere</p>

            <Button type="button" variant="outline"
              className="w-full h-14 text-lg font-medium mb-4 border-2 hover:bg-muted/50"
              onClick={handleGoogleSignIn} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><GoogleIcon /><span className="ml-3">Continue with Google</span></>}
            </Button>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button type="button" className="w-full h-14 text-lg font-semibold mb-3"
              onClick={() => setStep('login-email')}>Log in with Email</Button>
            <Button type="button" variant="outline" className="w-full h-14 text-lg font-semibold border-2"
              onClick={() => setStep('signup-email')}>Create Account</Button>

            {error && <p className="text-destructive text-sm mt-4 text-center">{error}</p>}
          </div>
        )}

        {/* Login Email */}
        {step === 'login-email' && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-2">Log in</h1>
            <p className="text-muted-foreground mb-8">Enter your email to continue</p>
            <form onSubmit={(e) => { e.preventDefault(); handleEmailSubmit(true); }}>
              <Input type="email" placeholder="Enter your email" value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                className={`h-14 text-lg px-4 ${error ? 'border-destructive' : ''}`}
                autoComplete="email" autoFocus disabled={isLoading} />
              {error && <p className="text-destructive text-sm mt-2">{error}</p>}
              <div className="mt-6">
                <Button type="submit" className="w-full h-14 text-lg font-semibold" disabled={!email.trim()}>Continue</Button>
              </div>
            </form>
            <p className="text-center text-muted-foreground mt-6">
              Don't have an account?{' '}
              <button type="button" onClick={() => setStep('signup-email')} className="text-primary font-medium hover:underline">Sign up</button>
            </p>
          </div>
        )}

        {/* Signup Email */}
        {step === 'signup-email' && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-2">Create account</h1>
            <p className="text-muted-foreground mb-8">Enter your email to get started</p>
            <form onSubmit={(e) => { e.preventDefault(); handleEmailSubmit(false); }}>
              <Input type="email" placeholder="Enter your email" value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                className={`h-14 text-lg px-4 ${error ? 'border-destructive' : ''}`}
                autoComplete="email" autoFocus disabled={isLoading} />
              {error && <p className="text-destructive text-sm mt-2">{error}</p>}
              <div className="mt-6">
                <Button type="submit" className="w-full h-14 text-lg font-semibold" disabled={!email.trim()}>Continue</Button>
              </div>
            </form>
            <p className="text-center text-muted-foreground mt-6">
              Already have an account?{' '}
              <button type="button" onClick={() => setStep('login-email')} className="text-primary font-medium hover:underline">Log in</button>
            </p>
          </div>
        )}

        {/* Login Password */}
        {step === 'login-password' && (
          <form onSubmit={handleLogin} className="flex-1 flex flex-col animate-fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back</h1>
            <p className="text-muted-foreground mb-8">Enter your password for {email}</p>
            <div className="relative">
              <Input type={showPassword ? 'text' : 'password'} placeholder="Enter your password"
                value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className={`h-14 text-lg px-4 pr-12 ${error ? 'border-destructive' : ''}`}
                autoFocus autoComplete="current-password" disabled={isLoading} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {error && <p className="text-destructive text-sm mt-2">{error}</p>}
            <button type="button" onClick={() => { setError(''); setStep('forgot-password'); }}
              className="text-primary text-sm font-medium mt-4 self-start hover:underline">Forgot password?</button>
            <div className="mt-auto pt-8">
              <Button type="submit" className="w-full h-14 text-lg font-semibold" disabled={!password || isLoading}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign in'}
              </Button>
            </div>
          </form>
        )}

        {/* Forgot Password */}
        {step === 'forgot-password' && (
          <form onSubmit={handleForgotPassword} className="flex-1 flex flex-col animate-fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-2">Reset your password</h1>
            <p className="text-muted-foreground mb-8">Enter your email and we'll send you a reset link</p>
            <Input type="email" placeholder="Enter your email" value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              className={`h-14 text-lg px-4 ${error ? 'border-destructive' : ''}`}
              autoFocus autoComplete="email" disabled={isLoading} />
            {error && <p className="text-destructive text-sm mt-2">{error}</p>}
            <div className="mt-auto pt-8">
              <Button type="submit" className="w-full h-14 text-lg font-semibold" disabled={!email.trim() || isLoading}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send reset link'}
              </Button>
            </div>
          </form>
        )}

        {/* Reset Link Sent */}
        {step === 'reset-sent' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Mail className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">Check your email</h1>
            <p className="text-muted-foreground mb-2">Password reset link sent to</p>
            <p className="font-semibold text-foreground mb-6">{email}</p>
            <div className="bg-muted/50 rounded-2xl p-5 mb-6 w-full max-w-sm">
              <div className="flex items-start gap-3 text-left">
                <KeyRound className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Reset your password</p>
                  <p>Click the link in the email to set a new password.</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Didn't receive the email? Check your spam folder.</p>
            <Button variant="outline" onClick={handleResendResetLink}
              disabled={resendCooldown > 0 || isLoading} className="w-full max-w-sm h-12">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> :
                resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend reset link'}
            </Button>
            <button onClick={() => { setStep('choose-mode'); setError(''); }}
              className="text-primary text-sm font-medium mt-4 hover:underline">Back to login</button>
          </div>
        )}

        {/* Reset Password */}
        {step === 'reset-password' && (
          <form onSubmit={handleResetPassword} className="flex-1 flex flex-col animate-fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-2">Set new password</h1>
            <p className="text-muted-foreground mb-8">Create a strong password for your account</p>
            <div className="space-y-4">
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} placeholder="New password"
                  value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className={`h-14 text-lg px-4 pr-12 ${error ? 'border-destructive' : ''}`}
                  autoFocus autoComplete="new-password" disabled={isLoading} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="relative">
                <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm new password"
                  value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  className={`h-14 text-lg px-4 pr-12 ${error ? 'border-destructive' : ''}`}
                  autoComplete="new-password" disabled={isLoading} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            {error && <p className="text-destructive text-sm mt-2">{error}</p>}
            <p className="text-muted-foreground text-xs mt-4">Password must be at least 6 characters</p>
            <div className="mt-auto pt-8">
              <Button type="submit" className="w-full h-14 text-lg font-semibold"
                disabled={!password || !confirmPassword || isLoading}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Reset password'}
              </Button>
            </div>
          </form>
        )}

        {/* Reset Expired */}
        {step === 'reset-expired' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">Link expired</h1>
            <p className="text-muted-foreground mb-6 max-w-sm">This password reset link has expired. Please request a new one.</p>
            <Button onClick={() => { setStep('forgot-password'); setError(''); }} className="w-full max-w-sm h-12">
              Request new link
            </Button>
            <button onClick={() => { setStep('choose-mode'); setError(''); }}
              className="text-primary text-sm font-medium mt-4 hover:underline">Back to login</button>
          </div>
        )}

        {/* Signup Details */}
        {step === 'signup-details' && (
          <form onSubmit={handleSignup} className="flex-1 flex flex-col animate-fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-2">Create your account</h1>
            <p className="text-muted-foreground mb-8">Enter your details for {email}</p>
            <div className="space-y-4">
              <Input type="text" placeholder="Full name" value={fullName}
                onChange={(e) => { setFullName(e.target.value); setError(''); }}
                className="h-14 text-lg px-4" autoFocus autoComplete="name" disabled={isLoading} />
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} placeholder="Create a password"
                  value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className={`h-14 text-lg px-4 pr-12 ${error ? 'border-destructive' : ''}`}
                  autoComplete="new-password" disabled={isLoading} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            {error && <p className="text-destructive text-sm mt-2">{error}</p>}
            <p className="text-muted-foreground text-xs mt-4">By continuing, you agree to our Terms of Service and Privacy Policy</p>
            <div className="mt-auto pt-8">
              <Button type="submit" className="w-full h-14 text-lg font-semibold"
                disabled={!fullName.trim() || !password || isLoading}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create account'}
              </Button>
            </div>
          </form>
        )}

        {/* Verification */}
        {step === 'verification' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">Verify your email</h1>
            <p className="text-muted-foreground mb-2">We sent a verification link to</p>
            <p className="font-semibold text-foreground mb-6">{email}</p>
            <div className="bg-muted/50 rounded-2xl p-5 mb-6 w-full max-w-sm">
              <div className="flex items-start gap-3 text-left">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Check your inbox</p>
                  <p>Click the link in the email to verify your account, then come back here to sign in.</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Didn't receive the email? Check your spam folder.</p>
            <Button variant="outline" onClick={handleResendVerification}
              disabled={resendCooldown > 0 || isLoading} className="w-full max-w-sm h-12">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> :
                resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend verification email'}
            </Button>
            <button onClick={() => { setStep('login-password'); setError(''); }}
              className="text-primary text-sm font-medium mt-4 hover:underline">
              I've verified, let me sign in
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Auth;
