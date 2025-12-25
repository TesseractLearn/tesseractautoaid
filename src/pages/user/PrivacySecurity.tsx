import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Shield, Key, Mail, Phone, CheckCircle, XCircle, LogOut, Trash2, Loader2, Chrome } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const PrivacySecurity: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEmailVerified = user?.email_confirmed_at;
  const isGoogleUser = user?.app_metadata?.provider === 'google';

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        if (error.message.toLowerCase().includes('same password')) {
          toast.error('Please choose a different password');
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success('Password updated successfully');
      setPasswordDialogOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Error changing password:', err);
      toast.error('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutAll = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      toast.success('Logged out from all devices');
      navigate('/auth');
    } catch (err) {
      console.error('Error logging out:', err);
      toast.error('Failed to logout');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      // Note: Full account deletion requires an edge function with admin privileges
      // For now, we sign out and inform the user
      await logout();
      toast.success('Please contact support to complete account deletion');
      navigate('/');
    } catch (err) {
      console.error('Error deleting account:', err);
      toast.error('Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card border-b border-border safe-area-inset-top">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">Privacy & Security</h1>
          <p className="text-sm text-muted-foreground">Manage your account and security settings</p>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Verification Status */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Verification Status</h2>
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Email</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              {isEmailVerified ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Verified</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-yellow-600">
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm">Not verified</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Phone</p>
                  <p className="text-sm text-muted-foreground">{user?.phone || 'Not added'}</p>
                </div>
              </div>
              {user?.phone ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Verified</span>
                </div>
              ) : (
                <Button variant="outline" size="sm">Add</Button>
              )}
            </div>
          </div>
        </section>

        {/* Sign-in Methods */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Sign-in Methods</h2>
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <p className="font-medium text-foreground">Email & Password</p>
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Connected</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Chrome className="w-5 h-5 text-muted-foreground" />
                <p className="font-medium text-foreground">Google</p>
              </div>
              {isGoogleUser ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Connected</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Not connected</span>
              )}
            </div>
          </div>
        </section>

        {/* Security Actions */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Security</h2>
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            <button
              onClick={() => setPasswordDialogOpen(true)}
              className="flex items-center gap-3 p-4 w-full text-left hover:bg-muted/50 transition-colors"
            >
              <Key className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium text-foreground">Change Password</p>
                <p className="text-sm text-muted-foreground">Update your account password</p>
              </div>
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="flex items-center gap-3 p-4 w-full text-left hover:bg-muted/50 transition-colors">
                  <LogOut className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Logout from All Devices</p>
                    <p className="text-sm text-muted-foreground">Sign out everywhere</p>
                  </div>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Logout from All Devices?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will sign you out from all devices including this one. You'll need to log in again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogoutAll}>Logout All</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>

        {/* Danger Zone */}
        <section>
          <h2 className="text-sm font-semibold text-destructive uppercase mb-3">Danger Zone</h2>
          <div className="bg-card border border-destructive/50 rounded-xl">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="flex items-center gap-3 p-4 w-full text-left hover:bg-destructive/5 transition-colors">
                  <Trash2 className="w-5 h-5 text-destructive" />
                  <div className="flex-1">
                    <p className="font-medium text-destructive">Delete Account</p>
                    <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                  </div>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Account Permanently?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account, vehicles, bookings, and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive hover:bg-destructive/90"
                    disabled={deleting}
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>
      </main>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your new password below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
              />
            </div>
            <Button onClick={handleChangePassword} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Update Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrivacySecurity;
