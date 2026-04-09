import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { MapPin, Heart, X, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useCallback } from 'react';
import { getInterestIcon } from '@/utils/interestIcons';

export interface ProfileData {
  id: string;
  name: string;
  age: number;
  location: string;
  bio: string;
  interests: string[];
  avatar_url: string;
  photos?: string[];
  city?: string;
}

interface SwipeCardProps {
  profile: ProfileData;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  isTop: boolean;
  onDislike?: () => void;
  onSuperlike?: () => void;
  onLike?: () => void;
}

const SwipeCard = ({ profile, onSwipe, isTop, onDislike, onSuperlike, onLike }: SwipeCardProps) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | 'up' | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);

  const rotate = useTransform(x, [-300, 300], [-30, 30]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);
  const superlikeOpacity = useTransform(y, [-100, 0], [1, 0]);

  // Get all photos, fallback to avatar if no photos
  const allPhotos = profile.photos && profile.photos.length > 0 
    ? profile.photos 
    : [profile.avatar_url || '/default-avatar.svg'];

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isDraggingPhoto) return; // Don't swipe card if dragging photos
    
    const threshold = 100;
    
    if (info.offset.y < -threshold) {
      setExitDirection('up');
      onSwipe('up');
    } else if (info.offset.x > threshold) {
      setExitDirection('right');
      onSwipe('right');
    } else if (info.offset.x < -threshold) {
      setExitDirection('left');
      onSwipe('left');
    }
  };

  const getExitAnimation = () => {
    switch (exitDirection) {
      case 'left':
        return { x: -500, rotate: -30, opacity: 0 };
      case 'right':
        return { x: 500, rotate: 30, opacity: 0 };
      case 'up':
        return { y: -500, scale: 0.8, opacity: 0 };
      default:
        return {};
    }
  };

  const goToNextPhoto = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (currentPhotoIndex < allPhotos.length - 1) {
      setCurrentPhotoIndex(prev => prev + 1);
    }
  }, [currentPhotoIndex, allPhotos.length]);

  const goToPrevPhoto = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(prev => prev - 1);
    }
  }, [currentPhotoIndex]);

  const handlePhotoAreaClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    
    // Click on left 30% goes to previous, right 30% goes to next
    if (clickX < width * 0.3) {
      if (currentPhotoIndex > 0) {
        setCurrentPhotoIndex(prev => prev - 1);
      }
    } else if (clickX > width * 0.7) {
      if (currentPhotoIndex < allPhotos.length - 1) {
        setCurrentPhotoIndex(prev => prev + 1);
      }
    }
  }, [currentPhotoIndex, allPhotos.length]);

  return (
    <motion.div
      className="absolute w-full h-full"
      style={{ x, y, rotate }}
      drag={isTop && !isDraggingPhoto}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      animate={exitDirection ? getExitAnimation() : {}}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileTap={{ cursor: 'grabbing' }}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-card bg-card">
        {/* Photo Carousel */}
        <div 
          className="relative w-full h-full"
          onClick={handlePhotoAreaClick}
        >
          {/* Photo Indicators */}
          {allPhotos.length > 1 && (
            <div className="absolute top-3 left-0 right-0 z-20 flex justify-center gap-1.5 px-4">
              {allPhotos.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 shrink-0 ${
                    index === currentPhotoIndex 
                      ? 'bg-white scale-110' 
                      : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Photos */}
          <div className="relative w-full h-full">
            {allPhotos.map((photo, index) => (
              <motion.img
                key={index}
                src={photo}
                alt={`${profile.name} foto ${index + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
                initial={false}
                animate={{ 
                  opacity: index === currentPhotoIndex ? 1 : 0,
                  scale: index === currentPhotoIndex ? 1 : 1.05
                }}
                transition={{ duration: 0.3 }}
                draggable={false}
              />
            ))}
          </div>

          {/* Navigation Arrows (visible on hover for desktop) */}
          {allPhotos.length > 1 && isTop && (
            <>
              {currentPhotoIndex > 0 && (
                <button
                  onClick={goToPrevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity md:opacity-60"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              {currentPhotoIndex < allPhotos.length - 1 && (
                <button
                  onClick={goToNextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity md:opacity-60"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </>
          )}
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 gradient-card-overlay pointer-events-none" />
        
        {/* Like Badge */}
        <motion.div
          className="absolute top-8 left-8 px-4 py-2 rounded-lg border-4 border-green-500 rotate-[-20deg] pointer-events-none"
          style={{ opacity: likeOpacity }}
        >
          <span className="text-green-500 text-3xl font-black">LIKE</span>
        </motion.div>
        
        {/* Nope Badge */}
        <motion.div
          className="absolute top-8 right-8 px-4 py-2 rounded-lg border-4 border-red-500 rotate-[20deg] pointer-events-none"
          style={{ opacity: nopeOpacity }}
        >
          <span className="text-red-500 text-3xl font-black">NOPE</span>
        </motion.div>
        
        {/* Superlike Badge */}
        <motion.div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg border-4 border-blue-500 pointer-events-none"
          style={{ opacity: superlikeOpacity }}
        >
          <span className="text-blue-500 text-3xl font-black">SUPER LIKE</span>
        </motion.div>
        
        {/* Profile Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-primary-foreground">
          <div className="flex items-end gap-3 mb-3">
            <h2 className="text-3xl font-bold">{profile.name}</h2>
            <span className="text-2xl font-light">{profile.age}</span>
          </div>
          
          <div className="flex items-center gap-2 mb-4 text-primary-foreground/80">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{profile.location}</span>
          </div>
          
          {profile.bio && (
            <p className="text-sm text-primary-foreground/90 mb-4 line-clamp-2">
              {profile.bio}
            </p>
          )}
          
          <div className="flex flex-wrap gap-2 mb-4">
            {profile.interests.slice(0, 5).map((interest, index) => {
              const Icon = getInterestIcon(interest);
              return (
                <span
                  key={index}
                  className="px-3 py-1 text-xs font-medium rounded-full bg-primary-foreground/20 backdrop-blur-sm flex items-center gap-1"
                >
                  <Icon className="w-3 h-3" />
                  {interest}
                </span>
              );
            })}
          </div>
          
          {/* Action Buttons inside card */}
          {isTop && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); onDislike?.(); }}
                className="h-14 w-14 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-red-500 hover:bg-white transition-colors"
              >
                <X className="h-7 w-7" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); onSuperlike?.(); }}
                className="h-12 w-12 rounded-full bg-blue-500 shadow-lg flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
              >
                <Star className="h-5 w-5" fill="currentColor" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); onLike?.(); }}
                className="h-14 w-14 rounded-full bg-purple-500 shadow-lg flex items-center justify-center text-white hover:bg-purple-600 transition-colors"
              >
                <Heart className="h-7 w-7" fill="currentColor" />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SwipeCard;
