import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Star, MapPin, Phone, Wrench, Shield, Clock, Briefcase, User, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MechanicProfile {
  id: string;
  full_name: string;
  phone: string | null;
  specialization: string | null;
  rating: number | null;
  total_rating_count: number | null;
  total_jobs_count: number | null;
  experience_years: number | null;
  is_available: boolean | null;
  is_verified: boolean | null;
  services_offered: string[] | null;
  address: string | null;
  profile_photo_url: string | null;
  created_at: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_name: string | null;
}

const serviceLabels: Record<string, string> = {
  puncture: 'Puncture Repair',
  battery: 'Battery Service',
  towing: 'Towing',
  engine: 'Engine Repair',
  general: 'General Service',
  ac_repair: 'AC Repair',
  denting: 'Denting & Painting',
  oil_service: 'Oil Service',
  brakes: 'Brake Service',
};

const ViewMechanicProfile: React.FC = () => {
  const { mechanicId } = useParams<{ mechanicId: string }>();
  const navigate = useNavigate();
  const [mechanic, setMechanic] = useState<MechanicProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mechanicId) return;
    const fetchData = async () => {
      setLoading(true);
      const [mechRes, revRes] = await Promise.all([
        supabase.from('mechanics').select('*').eq('id', mechanicId).maybeSingle(),
        supabase
          .from('mechanic_reviews')
          .select('id, rating, comment, created_at, user_id')
          .eq('mechanic_id', mechanicId)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);
      if (!mechRes.error && mechRes.data) setMechanic(mechRes.data);

      if (!revRes.error && revRes.data && revRes.data.length > 0) {
        const userIds = [...new Set(revRes.data.map((r: any) => r.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);
        const nameMap = new Map(profiles?.map((p: any) => [p.user_id, p.full_name]) || []);
        setReviews(
          revRes.data.map((r: any) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            created_at: r.created_at,
            user_name: nameMap.get(r.user_id) || 'Anonymous',
          }))
        );
      }
      setLoading(false);
    };
    fetchData();
  }, [mechanicId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-background border-b border-border sticky top-0 z-20">
          <div className="px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Skeleton className="h-6 w-40" />
          </div>
        </header>
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!mechanic) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <User className="h-16 w-16 text-muted-foreground/30" />
        <p className="text-muted-foreground">Mechanic profile not found</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const rating = mechanic.rating ? Number(mechanic.rating) : 0;
  const memberSince = new Date(mechanic.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-background border-b border-border sticky top-0 z-20">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Mechanic Profile</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Hero Card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                {mechanic.profile_photo_url ? (
                  <img src={mechanic.profile_photo_url} alt={mechanic.full_name} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground truncate">{mechanic.full_name}</h2>
                  {mechanic.is_verified && (
                    <Shield className="w-5 h-5 text-primary shrink-0" />
                  )}
                </div>
                {mechanic.specialization && (
                  <p className="text-sm text-muted-foreground mt-0.5">{mechanic.specialization}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  {mechanic.is_available ? (
                    <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                      Online
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Offline</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-lg font-bold text-foreground">{rating > 0 ? rating.toFixed(1) : '—'}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {mechanic.total_rating_count ? `${mechanic.total_rating_count} reviews` : 'No reviews'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Briefcase className="w-4 h-4 text-primary" />
                <span className="text-lg font-bold text-foreground">{mechanic.total_jobs_count || 0}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Jobs done</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-lg font-bold text-foreground">{mechanic.experience_years || 0}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Yrs exp.</p>
            </CardContent>
          </Card>
        </div>

        {/* Services */}
        {mechanic.services_offered && mechanic.services_offered.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-primary" /> Services Offered
              </h3>
              <div className="flex flex-wrap gap-2">
                {mechanic.services_offered.map(s => (
                  <Badge key={s} variant="secondary" className="text-xs">
                    {serviceLabels[s] || s}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact & Location */}
        <Card>
          <CardContent className="p-4 space-y-3">
            {mechanic.address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{mechanic.address}</span>
              </div>
            )}
            {mechanic.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{mechanic.phone}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Member since {memberSince}</p>
          </CardContent>
        </Card>

        {/* Reviews Section */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" /> Customer Reviews
              {reviews.length > 0 && (
                <Badge variant="secondary" className="text-xs ml-auto">{reviews.length}</Badge>
              )}
            </h3>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No reviews yet</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {reviews.map((review) => (
                  <div key={review.id} className="border border-border rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{review.user_name}</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{review.comment}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60">
                      {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Call Button */}
        {mechanic.phone && (
          <Button className="w-full" size="lg" onClick={() => window.open(`tel:${mechanic.phone}`, '_self')}>
            <Phone className="w-4 h-4 mr-2" /> Call {mechanic.full_name}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ViewMechanicProfile;
