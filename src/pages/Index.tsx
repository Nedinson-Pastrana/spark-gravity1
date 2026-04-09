import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfiles } from '@/hooks/useProfiles';
import SwipeCard, { ProfileData } from '@/components/SwipeCard';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import DiscoverFilters from '@/components/DiscoverFilters';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Heart } from 'lucide-react';

const Index = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lookingFor, setLookingFor] = useState(() => {
    return localStorage.getItem('discover_lookingFor') || 'all';
  });
  const [ageRange, setAgeRange] = useState<[number, number]>(() => {
    const saved = localStorage.getItem('discover_ageRange');
    return saved ? JSON.parse(saved) : [18, 40];
  });
  const { user, loading: authLoading } = useAuth();
  const { profiles, loading: profilesLoading, userProfile, profileChecked } = useProfiles({ lookingFor, ageRange });
  const navigate = useNavigate();

  // Sync lookingFor from profile on first load only if no saved filter
  useEffect(() => {
    if (userProfile?.looking_for && !localStorage.getItem('discover_lookingFor')) {
      setLookingFor(userProfile.looking_for);
    }
  }, [userProfile]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Only redirect to onboarding AFTER profile check is complete AND no profile exists
  useEffect(() => {
    if (!authLoading && user && profileChecked && !userProfile) {
      navigate('/onboarding');
    }
  }, [user, authLoading, profileChecked, userProfile, navigate]);

  const handleSwipe = useCallback(async (direction: 'left' | 'right' | 'up') => {
    const currentProfile = profiles[currentIndex];
    if (!currentProfile || !user) return;

    const action = direction === 'right' ? 'like' : direction === 'up' ? 'superlike' : 'dislike';

    // Record the match
    try {
      await supabase.from('matches').insert({
        user_id: user.id,
        liked_user_id: currentProfile.user_id,
        action,
      });

      if (action === 'like') {
        toast.success(`¡Te gusta ${currentProfile.name}!`, {
          icon: <Heart className="text-primary" fill="currentColor" />,
        });
      } else if (action === 'superlike') {
        toast.success(`¡Super Like a ${currentProfile.name}!`, {
          icon: '⭐',
        });
      }
    } catch (error) {
      console.error('Error saving match:', error);
    }

    // Move to next profile
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 300);
  }, [currentIndex, profiles, user]);

  const handleLike = () => handleSwipe('right');
  const handleDislike = () => handleSwipe('left');
  const handleSuperlike = () => handleSwipe('up');

  if (authLoading || profilesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-32 px-4" />
        <BottomNav />
      </div>
    );
  }

  // Convert profiles to ProfileData format
  const profileCards: ProfileData[] = profiles.map(p => ({
    id: p.id,
    name: p.name,
    age: p.age,
    location: p.city || p.location || '',
    bio: p.bio || '',
    interests: p.interests || [],
    avatar_url: p.avatar_url || '/default-avatar.svg',
    photos: p.photos || [],
    city: p.city || '',
  }));

  const visibleProfiles = profileCards.slice(currentIndex, currentIndex + 2);
  const noMoreProfiles = currentIndex >= profileCards.length;

  const handleFiltersChange = (newFilters: { lookingFor: string; ageRange: [number, number] }) => {
    setLookingFor(newFilters.lookingFor);
    setAgeRange(newFilters.ageRange);
    localStorage.setItem('discover_lookingFor', newFilters.lookingFor);
    localStorage.setItem('discover_ageRange', JSON.stringify(newFilters.ageRange));
    setCurrentIndex(0);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header rightAction={
        <DiscoverFilters
          lookingFor={lookingFor}
          ageRange={ageRange}
          onFiltersChange={handleFiltersChange}
        />
      } />
      
      <main className="pt-20 pb-32 px-4">
        <div className="max-w-md mx-auto">

          {/* Card Stack */}
          <div className="relative h-[65vh] min-h-[500px]">
            <AnimatePresence>
              {noMoreProfiles ? (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center text-center"
                >
                  <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center mb-6">
                    <Heart className="w-12 h-12 text-primary-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">¡Eso es todo por ahora!</h2>
                  <p className="text-muted-foreground max-w-xs">
                    No hay más perfiles disponibles en tu zona. Vuelve más tarde para encontrar nuevas conexiones.
                  </p>
                </div>
              ) : (
                visibleProfiles.map((profile, index) => (
                  <SwipeCard
                    key={profile.id}
                    profile={profile}
                    onSwipe={handleSwipe}
                    isTop={index === 0}
                    onDislike={handleDislike}
                    onSuperlike={handleSuperlike}
                    onLike={handleLike}
                  />
                )).reverse()
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Index;
