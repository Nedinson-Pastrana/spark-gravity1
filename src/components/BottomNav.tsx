import { Flame, Heart, MessageCircle, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUnreadCount } from '@/hooks/useUnreadCount';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadMessages, pendingLikesCount } = useUnreadCount();

  const navItems = [
    { icon: Flame, label: 'Discover', path: '/', badge: 0 },
    { icon: Heart, label: 'Likes', path: '/likes', badge: pendingLikesCount },
    { icon: MessageCircle, label: 'Mensajes', path: '/messages', badge: unreadMessages },
    { icon: User, label: 'Perfil', path: '/profile', badge: 0 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-6 py-4 bg-background/90 backdrop-blur-lg border-t border-border">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative">
                <Icon className={`h-6 w-6 ${isActive ? 'fill-primary/20' : ''}`} />
                {item.badge > 0 && (
                  <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center px-1">
                    {item.badge > 99 ? '99+' : item.badge}
                  </div>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
