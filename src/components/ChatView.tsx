import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChat } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { usePresence } from '@/hooks/usePresence';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

interface ChatViewProps {
  otherUser: Profile;
  onBack: () => void;
}

const ChatView = ({ otherUser, onBack }: ChatViewProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { messages, loading, sendMessage } = useChat(otherUser.user_id);
  const { onlineUsers, localDisconnects, typingUsers, sendTypingEvent } = usePresence();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [, setTick] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const knownMessageKeysRef = useRef<Set<string>>(new Set());

  const isOnline = onlineUsers.has(otherUser.user_id);
  const isTyping = typingUsers.has(otherUser.user_id);
  const localLastSeen = localDisconnects[otherUser.user_id];
  const backendLastSeen = otherUser.last_seen;

  let lastSeenStr = backendLastSeen;
  if (localLastSeen && backendLastSeen) {
    lastSeenStr = new Date(localLastSeen) > new Date(backendLastSeen) ? localLastSeen : backendLastSeen;
  } else if (localLastSeen) {
    lastSeenStr = localLastSeen;
  }

  // Force re-render every minute so relative time updates automatically
  useEffect(() => {
    if (isOnline) return;
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, [isOnline]);

  const formatRelativeTime = (dateString?: string | null) => {
    if (!dateString) return 'recientemente';
    let normalized = dateString;
    if (normalized.includes(' ') && !normalized.includes('T')) {
        normalized = normalized.replace(' ', 'T');
    }
    if (normalized.includes('T') && !normalized.endsWith('Z') && !normalized.includes('+', 11) && !normalized.includes('-', 11)) {
        normalized += 'Z';
    }
    const date = new Date(normalized);
    const now = new Date();
    const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
    
    if (diffInSeconds < 60) return `hace unos instantes`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `hace ${diffInMinutes} m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `hace ${diffInHours} h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return `hace 1 día`;
    if (diffInDays < 30) return `hace ${diffInDays} días`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths === 1) return `hace 1 mes`;
    if (diffInMonths < 12) return `hace ${diffInMonths} meses`;
    const diffInYears = Math.floor(diffInMonths / 12);
    if (diffInYears === 1) return `hace 1 año`;
    return `hace ${diffInYears} años`;
  };

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    }
  };

  useEffect(() => {
    if (!loading && messages.length > 0) {
      setTimeout(() => scrollToBottom(false), 50);
    }
  }, [loading]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(true);
    }
  }, [messages.length, isTyping]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    
    setSending(true);
    const { error } = await sendMessage(newMessage);
    if (!error) {
      setNewMessage('');
    }
    setSending(false);
  };

  const formatTime = (dateString: string) => {
    let normalized = dateString;
    if (normalized.includes(' ') && !normalized.includes('T')) {
        normalized = normalized.replace(' ', 'T');
    }
    if (normalized.includes('T') && !normalized.endsWith('Z') && !normalized.includes('+', 11) && !normalized.includes('-', 11)) {
        normalized += 'Z';
    }
    const date = new Date(normalized);
    return date.toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <header className="sticky top-0 z-40 px-4 py-3 bg-background/80 backdrop-blur-lg border-b border-border flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/user/${otherUser.user_id}`)}>
          <div className="relative">
            <img
              src={otherUser.avatar_url || '/default-avatar.svg'}
              alt={otherUser.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
            )}
          </div>
          <div>
            <h2 className="font-semibold text-foreground leading-none">{otherUser.name}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {isOnline ? 'Activo(a)' : `Activo(a) ${formatRelativeTime(lastSeenStr)}`}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <p>No hay mensajes aún</p>
            <p className="text-sm">¡Envía el primer mensaje!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === user?.id;
            const messageKey = message.clientKey ?? message.id;
            const isNew = !knownMessageKeysRef.current.has(messageKey);

            if (isNew) {
              knownMessageKeysRef.current.add(messageKey);
            }

            const shouldAnimate = isNew && !message.isOptimistic;

            return (
              <motion.div
                key={messageKey}
                initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                    isOwn
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm'
                  }`}
                >
                  <p className="break-words">{message.content}</p>
                  <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </motion.div>
            );
          })
          )}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="flex justify-start pt-2"
            >
              <div className="bg-muted text-foreground px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-0 px-4 py-3 bg-background border-t border-border">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              sendTypingEvent(otherUser.user_id);
            }}
            placeholder="Escribe un mensaje..."
            className="flex-1 rounded-full"
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button
            size="icon"
            className="rounded-full"
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
