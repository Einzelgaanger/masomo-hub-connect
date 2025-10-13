import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Smile,
  Paperclip,
  MessageSquare,
  Users
} from "lucide-react";

interface CampusMessage {
  id: string;
  sender_id: string;
  message: string;
  message_type: 'text' | 'image' | 'file';
  file_url?: string;
  file_name?: string;
  created_at: string;
  sender_name: string;
  sender_avatar?: string;
  isSending?: boolean;
}

export default function Ukumbi() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<CampusMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMessages();
      const cleanup = setupRealtimeSubscription();
      
      return () => {
        if (cleanup) cleanup();
      };
    }
  }, [user]);

  // Auto-scroll to bottom when messages load
  useEffect(() => {
    if (messages.length > 0) {
      const messagesContainer = document.querySelector('.messages-container');
      if (messagesContainer) {
        // Small delay to ensure DOM is updated
        setTimeout(() => {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
      }
    }
  }, [messages]);

  // Scroll to bottom function
  const scrollToBottom = () => {
    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      console.log('Fetching Ukumbi messages...');
      
      // For now, use localStorage with improved persistence
      // TODO: Replace with database once messages table is created
      const storedMessages = localStorage.getItem('ukumbi-messages');
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages);
        console.log('Loaded stored messages:', parsedMessages.length);
        setMessages(parsedMessages);
      } else {
        // Create initial welcome message
        const welcomeMessage: CampusMessage = {
          id: 'welcome-1',
          sender_id: 'system',
          message: 'Welcome to Ukumbi! This is a campus-wide chat where you can connect with fellow students.',
          message_type: 'text',
          created_at: new Date().toISOString(),
          sender_name: 'System',
          sender_avatar: undefined
        };
        
        const initialMessages = [welcomeMessage];
        localStorage.setItem('ukumbi-messages', JSON.stringify(initialMessages));
        setMessages(initialMessages);
        console.log('Created initial welcome message');
      }
      
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    console.log('Setting up localStorage polling for Ukumbi messages...');
    
    // For now, use polling to check for new messages in localStorage
    // This simulates real-time updates until database is ready
    const pollInterval = setInterval(() => {
      const storedMessages = localStorage.getItem('ukumbi-messages');
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages);
        setMessages(prev => {
          // Only update if there are new messages
          if (parsedMessages.length !== prev.length) {
            console.log('New messages detected via polling');
            return parsedMessages;
          }
          return prev;
        });
      }
    }, 2000); // Check every 2 seconds

    return () => {
      console.log('Cleaning up Ukumbi polling');
      clearInterval(pollInterval);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !user) return;

    try {
      setSending(true);
      
      // Create message with unique ID
      const newMessageData: CampusMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sender_id: user.id,
        message: newMessage.trim(),
        message_type: 'text',
        created_at: new Date().toISOString(),
        sender_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'You',
        sender_avatar: user.user_metadata?.avatar_url,
        isSending: false
      };

      // Add message to state immediately
      const updatedMessages = [...messages, newMessageData];
      setMessages(updatedMessages);
      
      // Persist to localStorage
      localStorage.setItem('ukumbi-messages', JSON.stringify(updatedMessages));
      console.log('Message sent and stored in localStorage');
      
      setNewMessage('');
      
      // Scroll to bottom
      setTimeout(() => {
        scrollToBottom();
      }, 100);

      // TODO: When database is ready, replace localStorage with database storage
      // For now, messages are shared across all users via localStorage
      // This is a temporary solution until the messages table is created

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // Function to clear chat (for debugging)
  const clearChat = () => {
    localStorage.removeItem('ukumbi-messages');
    setMessages([]);
    console.log('Chat cleared');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <div>
            <h1 className="text-2xl font-bold">Ukumbi</h1>
            <p className="text-muted-foreground">Campus-wide chat</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>All students</span>
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div className="flex-1 flex flex-col bg-green-50 dark:bg-green-900/20">
          <div className="flex-1 p-6 overflow-y-auto scrollbar-hide messages-container">
            <div className="space-y-1">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Start the Conversation</h3>
                  <p className="text-muted-foreground">
                    Be the first to send a message in the campus chat.
                  </p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isOwn = message.sender_id === user?.id;
                  const showAvatar = index === 0 || messages[index - 1]?.sender_id !== message.sender_id;
                  const showTimestamp = showAvatar || (new Date(message.created_at).getTime() - new Date(messages[index - 1]?.created_at || 0).getTime()) > 300000; // 5 minutes
                  
                  return (
                  <div
                    key={message.id}
                      className={`group relative transition-all duration-500 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 rounded-md p-1 -m-1`}
                    >
                      <div className={`flex gap-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar Column */}
                        {!isOwn && (
                          <div className="flex-shrink-0">
                            {showAvatar ? (
                              <div className="relative">
                                <img 
                                  src={message.sender_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${message.sender_name}`} 
                                  alt={message.sender_name}
                                  className="h-6 w-6 rounded-md object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-6 w-6 flex items-center justify-center">
                              {showTimestamp && (
                                <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    {formatTime(message.created_at)}
                                </span>
                              )}
                      </div>
                          )}
                          </div>
                        )}

                      {/* Message Content */}
                        <div className={`flex-1 min-w-0 ${isOwn ? 'flex flex-col items-end' : ''}`}>
                          {/* Header - Name and Time */}
                          {showAvatar && !isOwn && (
                            <div className="flex items-baseline gap-2 mb-0.5">
                              <button className="font-semibold text-gray-900 hover:underline text-sm">
                                {message.sender_name}
                              </button>
                              <span className="text-xs text-gray-500 font-medium">
                                {formatTime(message.created_at)}
                              </span>
                            </div>
                          )}

                          {/* Message Bubble */}
                          <div className={`relative text-sm leading-snug break-words px-2 py-2 rounded-lg max-w-xs ${
                              isOwn 
                              ? 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-900 ml-auto' 
                              : 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-900 mr-auto'
                          }`}>
                            {/* Custom triangle tail for message bubble */}
                            <div className={`absolute top-1 w-0 h-0 ${
                              isOwn 
                                ? 'right-[-6px] border-l-[6px] border-l-orange-200 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent'
                                : 'left-[-6px] border-r-[6px] border-r-purple-200 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent'
                            }`}></div>
                            
                            <span className="whitespace-pre-wrap">{message.message}</span>
                            
                            {/* Loading indicator for sending messages */}
                            {message.isSending && (
                              <div className="mt-1 flex items-center text-xs text-muted-foreground">
                                <div className="flex space-x-1">
                                  <div className="w-1 h-1 bg-current rounded-full animate-bounce"></div>
                                  <div className="w-1 h-1 bg-current rounded-full animate-bounce animation-delay-150"></div>
                                  <div className="w-1 h-1 bg-current rounded-full animate-bounce animation-delay-300"></div>
                              </div>
                                <span className="ml-2">Sending...</span>
                          </div>
                        )}
                            
                            {message.file_name && (
                              <div className="mt-1 p-1 bg-white/50 rounded text-xs">
                                <Paperclip className="h-3 w-3 inline mr-1" />
                                <span>{message.file_name}</span>
                              </div>
                            )}
                    </div>
                  </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
              </div>
                
          {/* Message Input */}
          <div className="border-t bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-4">
            <div className="flex gap-2">
            <div className="flex-1 relative">
            <Input
              value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="pr-12 h-11 rounded-xl border-2 focus:border-primary/50"
                  disabled={sending}
                />
              <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-primary/10"
                >
                  <Smile className="h-4 w-4" />
                </Button>
                  </div>
              <Button 
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="h-11 px-6 rounded-xl"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
            </div>
    </AppLayout>
  );
}