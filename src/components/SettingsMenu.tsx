import { X, Moon, Sun, Shield, Lock, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { Switch } from '@/components/ui/switch';

interface SettingsMenuProps {
  open: boolean;
  onClose: () => void;
}

const SettingsMenu = ({ open, onClose }: SettingsMenuProps) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <AnimatePresence>
      {open && (
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-50 bg-background flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b">
            <h2 className="text-xl font-semibold">Configuración</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {/* Aspecto */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Aspecto</h3>
              <div className="bg-card rounded-xl p-1 border">
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
                    <span className="font-medium">Modo Oscuro</span>
                  </div>
                  <Switch 
                    checked={theme === 'dark'} 
                    onCheckedChange={toggleTheme} 
                  />
                </div>
              </div>
            </div>

            {/* Privacidad y Seguridad */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Privacidad y Seguridad</h3>
              <div className="bg-card rounded-xl border overflow-hidden">
                <button className="w-full flex items-center justify-between p-4 border-b hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-primary" />
                    <span className="font-medium">Opciones de Privacidad</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
                <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-primary" />
                    <span className="font-medium">Seguridad de la Cuenta</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SettingsMenu;
