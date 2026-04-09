import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { ReactNode } from 'react';

interface HeaderProps {
  rightAction?: ReactNode;
  hideLogo?: boolean;
  transparent?: boolean;
}

const Header = ({ rightAction, hideLogo = false, transparent = false }: HeaderProps) => {
  return (
    <motion.header 
      className={`sticky top-0 z-40 px-6 py-4 transition-colors duration-300 ${
        transparent
          ? 'bg-transparent border-transparent'
          : 'bg-background/80 backdrop-blur-lg border-b border-border'
      }`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="w-full h-full flex items-center justify-between">
        <div className="w-10" />
        {!hideLogo && (
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <Flame className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-gradient">Spark</span>
          </motion.div>
        )}
        {hideLogo && <div className="flex-1" />}
        <div className="w-10 flex justify-end">
          {rightAction}
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
