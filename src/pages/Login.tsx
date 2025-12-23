import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Phone, Shield, Loader2 } from 'lucide-react';
import autoaidLogo from '@/assets/autoaid-logo.png';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { role, login, isLoading } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length >= 10) {
      setStep('otp');
      setError('');
    } else {
      setError('Please enter a valid phone number');
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    
    if (otpValue.length !== 6) {
      setError('Please enter the complete OTP');
      return;
    }

    const success = await login(phone, otpValue);
    
    if (success) {
      navigate(role === 'mechanic' ? '/mechanic' : '/user');
    } else {
      setError('Invalid OTP. Please try again. (Use 123456 for demo)');
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
            onClick={() => step === 'otp' ? setStep('phone') : navigate('/')}
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
          {step === 'phone' ? (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Enter your phone number
                </h1>
                <p className="text-muted-foreground text-sm">
                  We'll send you a verification code
                </p>
              </div>

              <form onSubmit={handlePhoneSubmit} className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center px-3 bg-secondary rounded-xl border border-border text-sm font-medium">
                      +91
                    </div>
                    <Input
                      type="tel"
                      placeholder="Enter 10-digit number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="flex-1 h-12 rounded-xl text-base"
                    />
                  </div>
                  {error && (
                    <p className="text-destructive text-sm mt-2">{error}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                >
                  Continue
                </Button>
              </form>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-success" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Verify OTP
                </h1>
                <p className="text-muted-foreground text-sm">
                  Enter the 6-digit code sent to +91 {phone}
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block text-center">
                    Enter OTP
                  </label>
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, index) => (
                      <Input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-14 text-center text-xl font-bold rounded-xl"
                      />
                    ))}
                  </div>
                  {error && (
                    <p className="text-destructive text-sm mt-3 text-center">{error}</p>
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
                      Verifying...
                    </>
                  ) : (
                    'Verify & Continue'
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={() => setOtp(['', '', '', '', '', ''])}
                  >
                    Resend OTP
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Demo Hint */}
          <div className="mt-auto pt-8">
            <div className="bg-secondary/50 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground">
                <strong>Demo Mode:</strong> Use OTP <strong className="text-primary">123456</strong> to login
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
