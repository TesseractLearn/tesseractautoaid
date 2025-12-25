import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Wrench, User, CreditCard, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Booking {
  id: string;
  service_type: string;
  status: string;
  address: string | null;
  estimated_price: number | null;
  final_price: number | null;
  created_at: string;
  completed_at: string | null;
  mechanic_id: string | null;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  accepted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  mechanic_arriving: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  in_progress: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  mechanic_arriving: 'Mechanic Arriving',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const BookingHistory: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRebook = (booking: Booking) => {
    navigate(`/user/book/${booking.service_type}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card border-b border-border safe-area-inset-top">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">Booking History</h1>
          <p className="text-sm text-muted-foreground">View your past and ongoing bookings</p>
        </div>
      </header>

      <main className="px-4 py-6">
        {bookings.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Clock className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No bookings yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              You haven't booked any services yet. Book your first service now!
            </p>
            <Button onClick={() => navigate('/user')}>
              Book a Service
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-card border border-border rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Wrench className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-foreground capitalize">
                        {booking.service_type.replace('_', ' ')} Service
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ID: {booking.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <Badge className={statusColors[booking.status] || 'bg-gray-100 text-gray-800'}>
                    {statusLabels[booking.status] || booking.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{format(new Date(booking.created_at), 'PPp')}</span>
                  </div>

                  {booking.address && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 mt-0.5" />
                      <span className="line-clamp-2">{booking.address}</span>
                    </div>
                  )}

                  {booking.mechanic_id && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span>Mechanic assigned</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard className="w-4 h-4" />
                    <span>
                      ₹{booking.final_price || booking.estimated_price || 'TBD'}
                      {!booking.final_price && booking.estimated_price && ' (est.)'}
                    </span>
                    {booking.status === 'completed' && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Paid
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  {booking.status === 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRebook(booking)}
                      className="flex-1"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Rebook
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                  >
                    View Details
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BookingHistory;
