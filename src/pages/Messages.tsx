import { useState, useEffect, useMemo, useRef } from 'react';
import { MessageCircle, Search, Plus } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import ChatView from '@/components/ChatView';

import { Input } from '@/components/ui/input';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useStories } from '@/hooks/useStories';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePresence } from '@/hooks/usePresence';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

const Messages = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { conversations, loading, refetch } = useMessages();
  const { stories, addStory } = useStories();
  const { toast } = useToast();
  const { onlineUsers, typingUsers } = usePresence();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingStory, setViewingStory] = useState<{ media_url: string; media_type: string; profile: Profile } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const chatUserId = searchParams.get('chat');
    if (chatUserId && conversations.length > 0 && !selectedUser) {
      const conversation = conversations.find(c => c.otherUser.user_id === chatUserId);
      if (conversation) {
        setSelectedUser(conversation.otherUser);
      }
    }
  }, [searchParams, conversations, selectedUser]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(c =>
      c.otherUser.name?.toLowerCase().includes(q) ||
      c.lastMessage?.content?.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  const formatTime = (dateString: string) => {
    let normalized = dateString;
    if (normalized.includes(' ') && !normalized.includes('T')) {
        normalized = normalized.replace(' ', 'T');
    }
    if (normalized.includes('T') && !normalized.endsWith('Z') && !normalized.includes('+', 11) && !normalized.includes('-', 11)) {
        normalized += 'Z';
    }
    const date = new Date(normalized);
    const now = new Date();
    const diff = Math.max(0, now.getTime() - date.getTime());
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  // Group stories by user (show latest per user)
  const storyUsers = useMemo(() => {
    const map = new Map<string, typeof stories[0]>();
    for (const s of stories) {
      if (!map.has(s.user_id)) map.set(s.user_id, s);
    }
    // Filter out own stories for the bubbles (own is shown separately)
    return Array.from(map.values()).filter(s => s.user_id !== user?.id);
  }, [stories, user]);

  const handleAddStory = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const isVideo = file.type.startsWith('video/');
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file);

    if (uploadError) {
      toast({ title: 'Error al subir', description: uploadError.message, variant: 'destructive' });
      return;
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);

    await addStory(urlData.publicUrl, isVideo ? 'video' : 'image');
    toast({ title: 'Historia agregada' });

    e.target.value = '';
  };

  const handleSelectUser = (user: Profile) => {
    setSelectedUser(user);
    setSearchParams({ chat: user.user_id });
  };

  const handleBack = () => {
    setSelectedUser(null);
    setSearchParams({});
  };

  if (selectedUser) {
    return <ChatView otherUser={selectedUser} onBack={handleBack} />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Mensajes header */}
      <header className="sticky top-0 z-40 px-6 py-4 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto flex items-center justify-center">
          <h1 className="text-xl font-bold text-foreground">Mensajes</h1>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-4 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar mensajes o personas..."
            className="pl-9 rounded-full"
          />
        </div>
      </div>

      {/* Stories Section */}
      <div className="px-4 py-3">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {/* Own story bubble */}
          <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer" onClick={handleAddStory}>
            <div className="relative w-16 h-16">
              <img
                src={profile?.avatar_url || '/default-avatar.svg'}
                alt="Tu historia"
                className="w-16 h-16 rounded-full object-cover border-2 border-muted"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                <Plus className="w-3 h-3 text-primary-foreground" />
              </div>
            </div>
            <span className="text-[11px] text-muted-foreground font-medium">Nuevo</span>
          </div>

          {/* Other users' stories */}
          {storyUsers.map((story) => (
            <div
              key={story.user_id}
              className="flex flex-col items-center gap-1 shrink-0 cursor-pointer"
              onClick={() => setViewingStory({ media_url: story.media_url, media_type: story.media_type, profile: story.profile })}
            >
              <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-br from-primary to-accent">
                <img
                  src={story.profile.avatar_url || '/default-avatar.svg'}
                  alt={story.profile.name}
                  className="w-full h-full rounded-full object-cover border-2 border-background"
                />
              </div>
              <span className="text-[11px] text-foreground font-medium truncate max-w-[64px]">
                {story.profile.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Conversations */}
      <main className="px-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              {searchQuery ? 'Sin resultados' : 'Sin mensajes aún'}
            </h2>
            <p className="text-muted-foreground">
              {searchQuery ? 'Intenta con otro término' : 'Cuando hagas match, podrás chatear aquí'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conversation) => {
              const isOnline = onlineUsers.has(conversation.otherUser.user_id);
              const isTyping = typingUsers.has(conversation.otherUser.user_id);
              return (
              <div
                key={conversation.id}
                onClick={() => handleSelectUser(conversation.otherUser)}
                className="flex items-center gap-4 p-4 rounded-2xl bg-card hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="relative">
                  <img 
                    src={conversation.otherUser.avatar_url || '/default-avatar.svg'} 
                    alt={conversation.otherUser.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-card rounded-full"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{conversation.otherUser.name}</h3>
                  {isTyping ? (
                    <p className="text-sm text-green-500 font-medium truncate italic animate-pulse">
                      escribiendo...
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage
                        ? `${conversation.lastMessage.sender_id === user?.id ? 'Tú: ' : ''}${conversation.lastMessage.content} · ${formatTime(conversation.lastMessage.created_at)}`
                        : 'Nuevo match'}
                    </p>
                  )}
                </div>
                {conversation.unreadCount > 0 && (
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center shrink-0">
                    <span className="text-xs text-primary-foreground font-bold">
                      {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                    </span>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Story Viewer Modal */}
      {viewingStory && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setViewingStory(null)}
        >
          <div className="absolute top-4 left-4 flex items-center gap-3 z-10">
            <img
              src={viewingStory.profile.avatar_url || '/default-avatar.svg'}
              alt={viewingStory.profile.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-white"
            />
            <span className="text-white font-semibold">{viewingStory.profile.name}</span>
          </div>
          {viewingStory.media_type === 'video' ? (
            <video
              src={viewingStory.media_url}
              autoPlay
              className="max-h-full max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={viewingStory.media_url}
              alt="Historia"
              className="max-h-full max-w-full object-contain"
            />
          )}
        </div>
      )}
      
      <BottomNav />
    </div>
  );
};

export default Messages;
