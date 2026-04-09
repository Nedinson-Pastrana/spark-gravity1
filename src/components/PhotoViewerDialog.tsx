import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PhotoViewerDialogProps {
  photos: string[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PhotoViewerDialog = ({ photos, initialIndex, open, onOpenChange }: PhotoViewerDialogProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  // Reset index when dialog opens with new initialIndex
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) setCurrentIndex(initialIndex);
    onOpenChange(isOpen);
  };

  if (photos.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none flex items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center min-h-[60vh]">
          <img
            src={photos[currentIndex] || '/default-avatar.svg'}
            alt={`Foto ${currentIndex + 1}`}
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.svg'; }}
          />

          {photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full"
                onClick={handlePrev}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full"
                onClick={handleNext}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === currentIndex ? 'bg-primary' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoViewerDialog;
