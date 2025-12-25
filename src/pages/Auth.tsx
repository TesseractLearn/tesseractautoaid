import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { ArrowLeft, Mail, Lock, Loader2, Eye, EyeOff, User, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import autoaidLogo from '@/assets/autoaid-logo.png';

// Separate schema for forgot password (only email required)
const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
});

// Zod validation schema for login
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Zod validation schema for signup (includes name)
const signupSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address').max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(72, 'Password must be less than 72 characters'),
});

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role, isLoading: authLoading } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string }>({});
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (role === 'user') {
        navigate('/user', { replace: true });
      } else if (role === 'mechanic') {
        navigate('/mechanic', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, authLoading, role, navigate]);

  // Reset verification state when mode changes
  useEffect(() => {
    if (mode !== 'signup') {
      setVerificationSent(false);
    }
  }, [mode]);

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const validateForm = (): boolean => {
    try {
      if (mode === 'forgot-password') {
        forgotPasswordSchema.parse({ email });
      } else if (mode === 'signup') {
        signupSchema.parse({ fullName, email, password });
      } else {
        loginSchema.parse({ email, password });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { fullName?: string; email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'fullName') fieldErrors.fullName = err.message;
          if (err.path[0] === 'email') fieldErrors.email = err.message;
          if (err.path[0] === 'password') fieldErrors.password = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const getLoginErrorMessage = (errorMessage: string): string => {
    const lowerError = errorMessage.toLowerCase();
    
    if (lowerError.includes('email not confirmed')) {
      return 'Please verify your email before logging in. Check your inbox for the verification link.';
    }
    
    if (lowerError.includes('invalid login credentials')) {
      return 'Incorrect email or password. Please check your credentials and try again.';
    }
    
    if (lowerError.includes('user not found')) {
      return 'No account found with this email. Please sign up first.';
    }
    
    if (lowerError.includes('too many requests')) {
      return 'Too many login attempts. Please wait a few minutes and try again.';
    }
    
    return errorMessage;
  };

  const getSignupErrorMessage = (errorMessage: string): string => {
    const lowerError = errorMessage.toLowerCase();
    
    if (lowerError.includes('already registered') || lowerError.includes('user already registered')) {
      return 'This email is already registered. Please login instead.';
    }
    
    if (lowerError.includes('password') && lowerError.includes('weak')) {
      return 'Password is too weak. Please use a stronger password with letters, numbers, and symbols.';
    }
    
    if (lowerError.includes('rate limit') || lowerError.includes('too many requests')) {
      return 'Too many signup attempts. Please wait a few minutes and try again.';
    }
    
    return errorMessage;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});

    try {
      if (mode === 'signup') {
        const normalizedEmail = email.trim().toLowerCase();
        
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) {
          const userFriendlyMessage = getSignupErrorMessage(error.message);
          toast.error(userFriendlyMessage);
          
          if (error.message.toLowerCase().includes('already registered')) {
            setMode('login');
          }
          return;
        }

        // Check if email confirmation is required
        if (data.user && !data.user.email_confirmed_at) {
          // Send custom verification email via Resend
          const verificationUrl = `${window.location.origin}/auth`;
          
          try {
            const { error: emailError } = await supabase.functions.invoke('send-verification-email', {
              body: {
                email: normalizedEmail,
                name: fullName.trim(),
                verificationUrl,
              },
            });

            if (emailError) {
              console.error('Failed to send custom verification email:', emailError);
              // Fall back to Supabase's built-in email (already sent during signUp)
            }
          } catch (emailErr) {
            console.error('Error calling verification email function:', emailErr);
          }

          setVerificationEmail(normalizedEmail);
          setVerificationSent(true);
          setResendCooldown(30);
          toast.success('Verification email sent! Please check your inbox to verify your account.');
        } else if (data.session) {
          // Auto-confirm is enabled, user is logged in
          toast.success('Account created successfully! Welcome to AutoAid.');
        }
      } else {
        const normalizedEmail = email.trim().toLowerCase();
        
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) {
          const userFriendlyMessage = getLoginErrorMessage(error.message);
          toast.error(userFriendlyMessage);
          
          // Set specific field errors for better UX
          if (error.message.toLowerCase().includes('email not confirmed')) {
            setErrors({ email: 'Email not verified. Check your inbox for the verification link.' });
          }
          return;
        }

        toast.success('Welcome back to AutoAid!');
        // Auth state change will handle redirect
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!verificationEmail) return;
    
    setIsLoading(true);
    try {
      // First resend via Supabase to generate new token
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: verificationEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      // Also send custom email via Resend for better deliverability
      const verificationUrl = `${window.location.origin}/auth`;
      
      try {
        await supabase.functions.invoke('send-verification-email', {
          body: {
            email: verificationEmail,
            verificationUrl,
          },
        });
      } catch (emailErr) {
        console.error('Error calling verification email function:', emailErr);
      }

      setResendCooldown(30);
      toast.success('Verification email resent! Please check your inbox.');
    } catch (error) {
      toast.error('Failed to resend verification email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Password reset link sent! Check your email.');
      setMode('login');
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      toast.error('Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (verificationSent) {
      setVerificationSent(false);
      return;
    }
    navigate('/');
  };

  const handleBackToLogin = () => {
    setVerificationSent(false);
    setMode('login');
    setEmail(verificationEmail);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Verification email sent screen
  if (verificationSent) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="safe-area-inset-top py-4 px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <img src={autoaidLogo} alt="AutoAid" className="h-8 w-8" />
              <span className="font-bold text-foreground">AutoAid</span>
            </div>
          </div>
        </header>

        {/* Verification Success Content */}
        <main className="flex-1 px-4 pb-8 flex flex-col justify-center items-center max-w-md mx-auto w-full">
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            
            <h1 className="text-2xl font-bold text-foreground mb-3">
              Verify Your Email
            </h1>
            
            <p className="text-muted-foreground mb-2">
              We've sent a verification link to:
            </p>
            
            <p className="font-medium text-foreground mb-6">
              {verificationEmail}
            </p>
            
            <div className="bg-muted/50 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-muted-foreground mb-2">
                <strong className="text-foreground">Next steps:</strong>
              </p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Check your email inbox</li>
                <li>Click the verification link</li>
                <li>Return here to log in</li>
              </ol>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Didn't receive the email? Check your spam folder or click below to resend.
            </p>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResendVerification}
                disabled={isLoading || resendCooldown > 0}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {resendCooldown > 0 
                  ? `Resend in ${resendCooldown}s` 
                  : 'Resend Verification Email'}
              </Button>
              
              <Button
                className="w-full"
                onClick={handleBackToLogin}
              >
                <Mail className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="safe-area-inset-top py-4 px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <img src={autoaidLogo} alt="AutoAid" className="h-8 w-8" />
            <span className="font-bold text-foreground">AutoAid</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-8 flex flex-col justify-center max-w-md mx-auto w-full">
        {/* Title */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {mode === 'login' 
              ? 'Sign in to continue to AutoAid' 
              : mode === 'signup'
              ? 'Sign up to get started with AutoAid'
              : 'Enter your email to receive a reset link'}
          </p>
        </div>

        {/* Mode Toggle - hide on forgot password */}
        {mode !== 'forgot-password' && (
          <div className="flex bg-muted rounded-xl p-1 mb-6 animate-fade-in">
            <button
              onClick={() => { setMode('login'); setErrors({}); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'login'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => { setMode('signup'); setErrors({}); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'signup'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Forgot Password Form */}
        {mode === 'forgot-password' ? (
          <form onSubmit={handleForgotPassword} className="space-y-4 animate-fade-in">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Send Reset Link
            </Button>

            <button
              type="button"
              onClick={() => { setMode('login'); setErrors({}); }}
              className="w-full text-sm text-primary hover:underline flex items-center justify-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Login
            </button>
          </form>
        ) : (
          /* Email + Password Form */
          <form onSubmit={handleEmailAuth} className="space-y-4 animate-fade-in">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-foreground">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`pl-10 ${errors.fullName ? 'border-destructive' : ''}`}
                    disabled={isLoading}
                    autoComplete="name"
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-destructive">{errors.fullName}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                  disabled={isLoading}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            {mode === 'login' && (
              <button
                type="button"
                onClick={() => { setMode('forgot-password'); setErrors({}); }}
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </button>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
        )}

        {/* Divider */}
        {mode !== 'forgot-password' && (
          <>
            <div className="flex items-center gap-4 my-6 animate-fade-in">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or continue with</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Google Sign In */}
            <Button
              variant="outline"
              size="lg"
              className="w-full animate-fade-in"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Continue with Google
            </Button>
          </>
        )}

        {/* Footer Text */}
        <p className="text-xs text-muted-foreground text-center mt-6 animate-fade-in">
          By continuing, you agree to our{' '}
          <button className="text-primary underline">Terms of Service</button>
          {' '}and{' '}
          <button className="text-primary underline">Privacy Policy</button>
        </p>
      </main>
    </div>
  );
};

export default Auth;
