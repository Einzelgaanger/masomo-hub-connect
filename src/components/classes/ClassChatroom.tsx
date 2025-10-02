import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Image, 
  Video, 
  Paperclip, 
  Smile,
  MoreVertical,
  Download,
  Play,
  Pause,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

interface ChatMessage {
  id: string;
  class_id: string;
  sender_id: string;
  message?: string;
  message_type: 'text' | 'image' | 'video' | 'file';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  reply_to_id?: string;
  created_at: string;
  sender_name: string;
  sender_avatar?: string;
  reply_to?: ChatMessage;
}

interface ClassChatroomProps {
  classId: string;
  className: string;
}

const ClassChatroom = ({ classId, className }: ClassChatroomProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMessages();
    subscribeToMessages();
  }, [classId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      
      // First get the messages
      const { data: messagesData, error } = await supabase
        .from('class_chat_messages')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      if (!messagesData || messagesData.length === 0) {
        setMessages([]);
        return;
      }

      // Get unique sender IDs, filtering out undefined/null values
      const senderIds = [...new Set(messagesData
        .map(msg => msg.sender_id)
        .filter(id => id && id !== 'undefined')
      )];
      
      let profilesMap = new Map();
      
      // Fetch profiles for senders only if we have valid IDs
      if (senderIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, profile_picture_url')
          .in('user_id', senderIds);

        profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      }

      // Transform data and fetch reply messages
      const transformedMessages = await Promise.all(
        messagesData.map(async (msg) => {
          const senderProfile = profilesMap.get(msg.sender_id);
          let replyTo = null;
          if (msg.reply_to_id) {
            const { data: replyData } = await supabase
              .from('class_chat_messages')
              .select('*')
              .eq('id', msg.reply_to_id)
              .single();
            
            if (replyData) {
              const replyProfile = profilesMap.get(replyData.sender_id);
              replyTo = {
                id: replyData.id,
                class_id: replyData.class_id,
                sender_id: replyData.sender_id,
                message: replyData.message,
                message_type: replyData.message_type,
                file_url: replyData.file_url,
                file_name: replyData.file_name,
                file_size: replyData.file_size,
                created_at: replyData.created_at,
                sender_name: replyProfile?.full_name || 'Unknown',
                sender_avatar: replyProfile?.profile_picture_url
              };
            }
          }

          return {
            id: msg.id,
            class_id: msg.class_id,
            sender_id: msg.sender_id,
            message: msg.message,
            message_type: msg.message_type,
            file_url: msg.file_url,
            file_name: msg.file_name,
            file_size: msg.file_size,
            reply_to_id: msg.reply_to_id,
            created_at: msg.created_at,
            sender_name: senderProfile?.full_name || 'Unknown',
            sender_avatar: senderProfile?.profile_picture_url,
            reply_to: replyTo
          };
        })
      );

      setMessages(transformedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`class_chat_${classId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'class_chat_messages',
          filter: `class_id=eq.${classId}`
        },
        (payload) => {
          fetchMessages(); // Refetch to get complete data with profiles
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !replyTo) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('class_chat_messages')
        .insert({
          class_id: classId,
          sender_id: user?.id,
          message: newMessage.trim(),
          message_type: 'text',
          reply_to_id: replyTo?.id || null
        });

      if (error) throw error;

      setNewMessage('');
      setReplyTo(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'image' | 'video' | 'file') => {
    if (!file) return;

    setUploadingFile(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `class-chat/${classId}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      // Send message with file
      const { error: messageError } = await supabase
        .from('class_chat_messages')
        .insert({
          class_id: classId,
          sender_id: user?.id,
          message_type: type,
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          reply_to_id: replyTo?.id || null
        });

      if (messageError) throw messageError;

      setReplyTo(null);
      toast({
        title: "Success",
        description: "File uploaded successfully.",
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file.",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderMessage = (message: ChatMessage) => {
    const isOwnMessage = message.sender_id === user?.id;
    
    return (
      <div
        key={message.id}
        className={`flex gap-3 mb-4 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
      >
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={message.sender_avatar} />
          <AvatarFallback className="text-xs">
            {message.sender_name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        
        <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium">{message.sender_name}</span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(message.created_at), 'HH:mm')}
            </span>
          </div>
          
          {message.reply_to && (
            <div className="bg-muted p-2 rounded-lg mb-2 text-xs border-l-2 border-primary">
              <div className="font-medium">{message.reply_to.sender_name}</div>
              <div className="text-muted-foreground truncate">
                {message.reply_to.message || `${message.reply_to.message_type} file`}
              </div>
            </div>
          )}
          
          <div
            className={`rounded-lg p-3 ${
              isOwnMessage
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
          >
            {message.message_type === 'text' && (
              <p className="text-sm">{message.message}</p>
            )}
            
            {message.message_type === 'image' && (
              <div className="space-y-2">
                <img
                  src={message.file_url}
                  alt="Shared image"
                  className="max-w-full h-auto rounded-lg cursor-pointer"
                  onClick={() => window.open(message.file_url, '_blank')}
                />
                {message.file_name && (
                  <p className="text-xs opacity-75">{message.file_name}</p>
                )}
              </div>
            )}
            
            {message.message_type === 'video' && (
              <div className="space-y-2">
                <video
                  src={message.file_url}
                  controls
                  className="max-w-full h-auto rounded-lg"
                >
                  Your browser does not support the video tag.
                </video>
                {message.file_name && (
                  <p className="text-xs opacity-75">{message.file_name}</p>
                )}
              </div>
            )}
            
            {message.message_type === 'file' && (
              <div className="flex items-center gap-3 p-2 bg-background/10 rounded-lg">
                <Paperclip className="h-4 w-4" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{message.file_name}</p>
                  {message.file_size && (
                    <p className="text-xs opacity-75">{formatFileSize(message.file_size)}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(message.file_url, '_blank')}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1 mt-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={() => setReplyTo(message)}
            >
              Reply
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          💬 {className} Chat
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-1">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-2">💬</div>
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map(renderMessage)
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Reply Preview */}
        {replyTo && (
          <div className="px-4 py-2 bg-muted/50 border-t">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium">Replying to {replyTo.sender_name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {replyTo.message || `${replyTo.message_type} file`}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setReplyTo(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingFile}
              >
                <Image className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => videoInputRef.current?.click()}
                disabled={uploadingFile}
              >
                <Video className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
            
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={sending || uploadingFile}
            />
            
            <Button
              onClick={sendMessage}
              disabled={sending || uploadingFile || (!newMessage.trim() && !replyTo)}
              size="sm"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {uploadingFile && (
            <div className="mt-2 text-xs text-muted-foreground">
              Uploading file...
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file, 'image');
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file, 'video');
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file, 'file');
        }}
      />
    </Card>
  );
};

export default ClassChatroom;
