import { motion } from 'framer-motion';
import { X, Heart, Star, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

interface ActionButtonsProps {
  onDislike: () => void;
  onSuperlike: () => void;
  onLike: () => void;
  onUndo?: () => void;
  disabled?: boolean;
}

const ActionButtons = ({ onDislike, onSuperlike, onLike, onUndo, disabled }: ActionButtonsProps) => {
  return (
    <motion.div 
      className="flex items-center justify-center gap-4"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      {onUndo && (
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            variant="outline"
            size="icon"
            onClick={onUndo}
            disabled={disabled}
            className="h-12 w-12 rounded-full border-2"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </motion.div>
      )}
      
      <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
        <Button
          variant="dislike"
          size="iconXl"
          onClick={onDislike}
          disabled={disabled}
          className="shadow-lg"
        >
          <X className="h-8 w-8" />
        </Button>
      </motion.div>
      
      <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
        <Button
          variant="superlike"
          size="iconLg"
          onClick={onSuperlike}
          disabled={disabled}
        >
          <Star className="h-6 w-6" fill="currentColor" />
        </Button>
      </motion.div>
      
      <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
        <Button
          variant="like"
          size="iconXl"
          onClick={onLike}
          disabled={disabled}
        >
          <Heart className="h-8 w-8" fill="currentColor" />
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default ActionButtons;
