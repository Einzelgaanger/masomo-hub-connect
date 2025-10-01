import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Image as ImageIcon, Paperclip, Loader2, File } from 'lucide-react';
import { format } from 'date-fns';

interface ChatMessage {
  id: string;
  message: string | null;
  media_url: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    profile_picture_url: string | null;
  };
}

interface ClassChatroomProps {
  classId: string;
  chatroomId: string | null;
}

export function ClassChatroom({ classId, chatroomId }: ClassChatroomProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [actualChatroomId, setActualChatroomId] = useState<string | null>(chatroomId);

  useEffect(() => {
    if (classId) {
      ensureChatroomExists();
    }
  }, [classId]);

  useEffect(() => {
    if (actualChatroomId) {
      fetchMessages();
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [actualChatroomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const ensureChatroomExists = async () => {
    try {
      // Check if chatroom exists for this class
      const { data: existingChatroom } = await supabase
        .from('class_chatrooms')
        .select('id')
        .eq('class_id', classId)
        .single();

      if (existingChatroom) {
        setActualChatroomId(existingChatroom.id);
      } else {
        // Create chatroom if it doesn't exist (shouldn't happen due to trigger, but just in case)
        const { data: newChatroom, error } = await supabase
          .from('class_chatrooms')
          .insert({ class_id: classId })
          .select()
          .single();

        if (error) throw error;
        setActualChatroomId(newChatroom.id);
      }
    } catch (error: any) {
      console.error('Error ensuring chatroom exists:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chatroom',
        variant: 'destructive',
      });
    }
  };

  const fetchMessages = async () => {
    if (!actualChatroomId) return;

    try {
      const { data, error } = await supabase
        .from('class_messages')
        .select(`
          *,
          profiles (
            full_name,
            profile_picture_url
          )
        `)
        .eq('chatroom_id', actualChatroomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!actualChatroomId) return () => {};

    const channel = supabase
      .channel(`class-chatroom-${actualChatroomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'class_messages',
          filter: `chatroom_id=eq.${actualChatroomId}`,
        },
        (payload) => {
          if (payload.new.user_id !== user?.id) {
            fetchNewMessage(payload.new.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchNewMessage = async (messageId: string) => {
    try {
      const { data, error } = await supabase
        .from('class_messages')
        .select(`
          *,
          profiles (
            full_name,
            profile_picture_url
          )
        `)
        .eq('id', messageId)
        .single();

      if (error) throw error;
      if (data) {
        setMessages(prev => [...prev, data]);
      }
    } catch (error) {
      console.error('Error fetching new message:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !actualChatroomId) return;

    setSending(true);
    try {
      const { data, error } = await supabase
        .from('class_messages')
        .insert({
          chatroom_id: actualChatroomId,
          user_id: user?.id,
          message: newMessage.trim(),
        })
        .select(`
          *,
          profiles (
            full_name,
            profile_picture_url
          )
        `)
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, data]);
      setNewMessage('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    handleFileUpload(file);
  };

  const handleFileUpload = async (file: File) => {
    if (!actualChatroomId) return;

    setUploading(true);
    try {
      const isImage = file.type.startsWith('image/');
      const bucketName = isImage ? 'class-images' : 'class-files';
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      // Insert message
      const { data: messageData, error: messageError } = await supabase
        .from('class_messages')
        .insert({
          chatroom_id: actualChatroomId,
          user_id: user?.id,
          message: isImage ? null : file.name,
          media_url: isImage ? publicUrl : null,
          file_url: !isImage ? publicUrl : null,
          file_name: file.name,
          file_type: file.type,
        })
        .select(`
          *,
          profiles (
            full_name,
            profile_picture_url
          )
        `)
        .single();

      if (messageError) throw messageError;

      setMessages(prev => [...prev, messageData]);
      toast({
        title: 'Success',
        description: isImage ? 'Image uploaded' : 'File uploaded',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.user_id === user?.id;
          
          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={message.profiles?.profile_picture_url || undefined} />
                <AvatarFallback>
                  {message.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className={`flex-1 max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                {!isOwnMessage && (
                  <p className="text-xs font-medium mb-1">{message.profiles?.full_name}</p>
                )}
                
                <div className={`rounded-lg p-3 ${
                  isOwnMessage 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  {message.media_url && (
                    <img 
                      src={message.media_url} 
                      alt="Shared image" 
                      className="rounded mb-2 max-w-full max-h-64 object-cover cursor-pointer"
                      onClick={() => window.open(message.media_url!, '_blank')}
                    />
                  )}
                  
                  {message.file_url && (
                    <a
                      href={message.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:underline"
                    >
                      <File className="h-4 w-4" />
                      {message.file_name}
                    </a>
                  )}
                  
                  {message.message && (
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.message}
                    </p>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(message.created_at), 'HH:mm')}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 0 && !loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,application/pdf,.doc,.docx,.txt"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              fileInputRef.current?.setAttribute('accept', 'image/*');
              fileInputRef.current?.click();
            }}
            disabled={uploading}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={sending || uploading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending || uploading}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

