import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Send, 
  Heart, 
  Image, 
  Video, 
  Download, 
  Eye,
  Users,
  MessageCircle,
  Paperclip
} from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  content: string;
  message_type: 'text' | 'image' | 'video';
  media_url?: string;
  media_filename?: string;
  media_size?: number;
  likes_count: number;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    profile_picture_url?: string;
    character_id?: string;
    classes: {
      course_name: string;
    };
  };
  message_likes: {
    user_id: string;
  }[];
}

export default function Ukumbi() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    if (userProfile) {
      fetchMessages();
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [userProfile]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          classes!inner(
            course_name,
            university_id
          )
        `)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles(
            full_name,
            profile_picture_url,
            character_id,
            classes(
              course_name
            )
          ),
          message_likes(
            user_id
          )
        `)
        .eq('university_id', userProfile?.classes?.university_id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!userProfile?.classes?.university_id) return;

    const channel = supabase
      .channel('ukumbi-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `university_id=eq.${userProfile.classes.university_id}`
        },
        (payload) => {
          // Fetch the new message with profile data
          fetchNewMessage(payload.new.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `university_id=eq.${userProfile.classes.university_id}`
        },
        (payload) => {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === payload.new.id 
                ? { ...msg, likes_count: payload.new.likes_count }
                : msg
            )
          );
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
        .from('messages')
        .select(`
          *,
          profiles(
            full_name,
            profile_picture_url,
            character_id,
            classes(
              course_name
            )
          ),
          message_likes(
            user_id
          )
        `)
        .eq('id', messageId)
        .single();

      if (error) throw error;
      setMessages(prev => [...prev, data]);
    } catch (error) {
      console.error('Error fetching new message:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userProfile?.classes?.university_id || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          user_id: user?.id,
          university_id: userProfile.classes.university_id,
          content: newMessage.trim(),
          message_type: 'text'
        });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile?.classes?.university_id || uploading) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('ukumbi-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('ukumbi-media')
        .getPublicUrl(filePath);

      // Determine message type
      const messageType = file.type.startsWith('image/') ? 'image' : 'video';

      // Insert message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          user_id: user?.id,
          university_id: userProfile.classes.university_id,
          content: `${messageType === 'image' ? '📷' : '🎥'} ${file.name}`,
          message_type: messageType,
          media_url: publicUrl,
          media_filename: file.name,
          media_size: file.size
        });

      if (messageError) throw messageError;

      toast({
        title: "Media shared!",
        description: "Your file has been shared successfully",
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Failed to share media",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toggleLike = async (messageId: string) => {
    if (!user) return;

    try {
      const message = messages.find(m => m.id === messageId);
      const isLiked = message?.message_likes.some(like => like.user_id === user.id);

      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('message_likes')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('message_likes')
          .insert({
            message_id: messageId,
            user_id: user.id
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const downloadMedia = async (mediaUrl: string, filename: string) => {
    try {
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download failed",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading || !userProfile) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading Ukumbi...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full max-h-screen">
        {/* Header */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">Ukumbi</h1>
              </div>
              <Badge variant="secondary" className="ml-auto">
                <Users className="h-3 w-3 mr-1" />
                University Chat
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="flex-1 overflow-hidden">
          <CardContent className="p-4 h-full flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No messages yet. Be the first to say something!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 sm:gap-3 ${
                      message.user_id === user?.id ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                      <AvatarImage src={message.profiles.profile_picture_url} />
                      <AvatarFallback>
                        {message.profiles.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div
                      className={`max-w-[75%] sm:max-w-[70%] space-y-1 ${
                        message.user_id === user?.id ? 'items-end' : 'items-start'
                      } flex flex-col`}
                    >
                      {/* Message Header */}
                      <div className={`flex items-center gap-2 text-xs text-muted-foreground ${
                        message.user_id === user?.id ? 'flex-row-reverse' : 'flex-row'
                      }`}>
                        <button
                          onClick={() => navigate(`/profile/${message.user_id}`)}
                          className="font-medium hover:underline cursor-pointer"
                        >
                          {message.profiles.full_name}
                        </button>
                        <span>•</span>
                        <span>{message.profiles.classes.course_name}</span>
                        <span>•</span>
                        <span>{format(new Date(message.created_at), 'HH:mm')}</span>
                      </div>

                      {/* Message Content */}
                      <div
                        className={`px-3 py-2 rounded-2xl ${
                          message.user_id === user?.id
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted rounded-bl-md'
                        }`}
                      >
                        {message.message_type === 'text' ? (
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm">{message.content}</p>
                            <div className="space-y-2">
                              {message.message_type === 'image' ? (
                                <div className="relative group">
                                  <img
                                    src={message.media_url}
                                    alt={message.media_filename}
                                    className="max-w-full max-h-64 rounded-lg cursor-pointer"
                                    onClick={() => window.open(message.media_url, '_blank')}
                                  />
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => window.open(message.media_url, '_blank')}
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="relative group">
                                  <video
                                    src={message.media_url}
                                    controls
                                    className="max-w-full max-h-64 rounded-lg"
                                  />
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => window.open(message.media_url, '_blank')}
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{message.media_filename}</span>
                                <div className="flex items-center gap-2">
                                  <span>{message.media_size && formatFileSize(message.media_size)}</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => downloadMedia(message.media_url!, message.media_filename!)}
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Like Button */}
                      <div className={`flex items-center gap-1 ${
                        message.user_id === user?.id ? 'justify-end' : 'justify-start'
                      }`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2"
                          onClick={() => toggleLike(message.id)}
                        >
                          <Heart
                            className={`h-3 w-3 ${
                              message.message_likes.some(like => like.user_id === user?.id)
                                ? 'fill-red-500 text-red-500'
                                : ''
                            }`}
                          />
                          {message.likes_count > 0 && (
                            <span className="ml-1 text-xs">{message.likes_count}</span>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="flex gap-1 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="h-9 w-9 sm:h-10 sm:w-10 p-0"
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-primary"></div>
                ) : (
                  <Paperclip className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 text-sm sm:text-base h-9 sm:h-10"
                disabled={sending || !userProfile}
              />
              <Button type="submit" size="sm" disabled={sending || !newMessage.trim() || !userProfile} className="h-9 sm:h-10 px-3 sm:px-4">
                {sending ? (
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
            </form>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
              title="Upload media file"
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
