import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { retryRequest, testSupabaseConnection } from "@/utils/networkUtils";
import { ChatTableManager } from "@/utils/chatTableManager";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft,
  BookOpen, 
  Users, 
  Send, 
  Smile, 
  Paperclip,
  Clock,
  CheckCircle2,
  Play,
  Download,
  Star,
  Plus,
  MessageSquare,
  Calendar,
  GraduationCap
} from "lucide-react";

interface ClassUnit {
  id: string;
  name: string;
  description: string;
  order_index: number;
  created_at: string;
  materials_count?: number;
  is_completed?: boolean;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  message: string;
  message_type: 'text' | 'image' | 'file';
  file_url?: string;
  file_name?: string;
  created_at: string;
  sender_name: string;
  sender_avatar?: string;
}

interface ClassInfo {
  id: string;
  name: string;
  description: string;
  class_code: string;
  created_at: string;
  members_count: number;
  role: 'creator' | 'member';
}

export default function ClassPage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [units, setUnits] = useState<ClassUnit[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (classId) {
      fetchClassData();
      setupRealtimeSubscription();
    }
  }, [classId]);

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

  const fetchClassData = async () => {
    try {
      setLoading(true);
      
      // Fetch class info
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          description,
          class_code,
          created_at,
          class_members!inner(
            role,
            user_id
          )
        `)
        .eq('id', classId)
        .eq('class_members.user_id', user?.id)
        .single();

      if (classError) throw classError;

      const memberRole = classData.class_members?.[0]?.role || 'member';
      
      setClassInfo({
        id: classData.id,
        name: classData.name,
        description: classData.description,
        class_code: classData.class_code,
        created_at: classData.created_at,
        members_count: 0, // Will be updated
        role: memberRole
      });

      // Fetch units (with error handling for missing table)
      try {
        const { data: unitsData, error: unitsError } = await supabase
          .from('class_units')
          .select('*')
          .eq('class_id', classId)
          .order('order_index', { ascending: true });

        if (unitsError) {
          console.warn('Units table not accessible:', unitsError);
          setUnits([]); // Set empty array if table doesn't exist
        } else {
          setUnits(unitsData || []);
        }
      } catch (unitsError) {
        console.warn('Units table not accessible:', unitsError);
        setUnits([]); // Set empty array if table doesn't exist
      }

      // Fetch members count
      const { count: membersCount } = await supabase
        .from('class_members')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classId);

      setClassInfo(prev => prev ? { ...prev, members_count: membersCount || 0 } : null);

      // Fetch recent messages (with error handling)
      try {
        const { data: messagesData, error: messagesError } = await supabase
          .from('class_chat_messages')
          .select(`
            id,
            sender_id,
            message,
            message_type,
            file_url,
            file_name,
            created_at
          `)
          .eq('class_id', classId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (messagesError) {
          console.warn('Chat messages not accessible:', messagesError);
          // Try using ChatTableManager as fallback
          try {
            const chatManager = ChatTableManager.getInstance();
            const result = await chatManager.fetchMessages(classId);
            if (result.messages && result.messages.length > 0) {
              setMessages(result.messages);
            } else {
              setMessages([]);
            }
          } catch (fallbackError) {
            console.warn('Fallback fetch also failed:', fallbackError);
            setMessages([]);
          }
        } else {
          // Fetch profile data for each unique sender
          const uniqueSenders = [...new Set(messagesData?.map(msg => msg.sender_id) || [])];
          const profiles: Record<string, any> = {};
          
          // Fetch profiles with error handling
          for (const senderId of uniqueSenders) {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('user_id, full_name, profile_picture_url')
                .eq('user_id', senderId)
                .single();
              
              if (profile) {
                profiles[senderId] = profile;
              }
            } catch (error) {
              console.warn(`Failed to fetch profile for sender ${senderId}:`, error);
              // Continue with other profiles
            }
          }

          const formattedMessages = messagesData?.map(msg => ({
            id: msg.id,
            sender_id: msg.sender_id,
            message: msg.message,
            message_type: msg.message_type,
            file_url: msg.file_url,
            file_name: msg.file_name,
            created_at: msg.created_at,
            sender_name: profiles[msg.sender_id]?.full_name || 'Unknown',
            sender_avatar: profiles[msg.sender_id]?.profile_picture_url
          })) || [];

          setMessages(formattedMessages.reverse());
        }
      } catch (messagesError) {
        console.warn('Chat messages not accessible:', messagesError);
        setMessages([]); // Set empty array if table doesn't exist
      }

    } catch (error) {
      console.error('Error fetching class data:', error);
      toast({
        title: "Error",
        description: "Failed to load class data. Please try again.",
        variant: "destructive",
      });
      navigate('/masomo');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const chatManager = ChatTableManager.getInstance();
    
    return chatManager.setupRealtimeSubscription(classId!, (message) => {
      setMessages(prev => {
        // Remove any temporary messages from the same sender
        const filteredMessages = prev.filter(msg => 
          !(msg.id.startsWith('temp-') && msg.sender_id === message.sender_id)
        );
        // Add the real message at the end (newest at bottom)
        const realMessage = { ...message, isSending: false };
        const newMessages = [...filteredMessages, realMessage];
        
        // Scroll to bottom when new message arrives
        setTimeout(() => {
          scrollToBottom();
        }, 100);
        
        return newMessages;
      });
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      
      const chatManager = ChatTableManager.getInstance();
      const result = await chatManager.sendMessage(classId!, newMessage.trim(), user?.id!);

      if (result.success) {
        setNewMessage('');
        // Add message optimistically to show immediately
        const optimisticMessage = {
          id: `temp-${Date.now()}`,
          sender_id: user?.id!,
          message: newMessage.trim(),
          message_type: 'text' as const,
          created_at: new Date().toISOString(),
          sender_name: user?.user_metadata?.full_name || 'You',
          sender_avatar: user?.user_metadata?.avatar_url,
          isSending: true // Add loading indicator
        };
        setMessages(prev => [...prev, optimisticMessage]);
        
        // Set a timeout to remove loading indicator if realtime doesn't work
        setTimeout(() => {
          setMessages(prev => prev.map(msg => 
            msg.id === optimisticMessage.id 
              ? { ...msg, isSending: false }
              : msg
          ));
        }, 5000); // 5 second timeout
      } else {
        // Remove optimistic message if sending failed
        setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
        
        // Show detailed error message
        toast({
          title: "Error",
          description: result.error || "Failed to send message",
          variant: "destructive",
        });

        // If table doesn't exist, show instructions
        if (result.error?.includes('table does not exist')) {
          console.log(chatManager.getTableCreationInstructions());
        }
      }
    } catch (error) {
      // Remove optimistic message if sending failed
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
      
      console.error('Unexpected error sending message:', error);
      toast({
        title: "Error",
        description: `Unexpected error: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
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
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!classInfo) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Class Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The class you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => navigate('/masomo')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Classes
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/masomo')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">{classInfo.name}</h1>
              <p className="text-muted-foreground">{classInfo.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {units.length} units
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {classInfo.members_count} members
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Section - Takes 3/4 of the width */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="h-[75vh] flex flex-col bg-green-50 dark:bg-green-900/20">
                <div className="flex-1 p-6 overflow-y-auto scrollbar-hide messages-container" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                  <div className="space-y-1">
                    {messages.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Start the Conversation</h3>
                        <p className="text-muted-foreground">
                          Be the first to send a message in this classroom.
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
                                  {(message as any).isSending && (
                                    <div className="mt-1 flex items-center text-xs text-muted-foreground">
                                      <div className="flex space-x-1">
                                        <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                        <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                        <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
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
                      size="sm"
                      className="h-11 px-6 rounded-xl"
                    >
                      {sending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Send</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
          </div>

          {/* Units Section - Professional Design */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Course Units</h2>
              <Badge variant="secondary" className="text-xs font-mono">
                {classInfo.class_code}
              </Badge>
            </div>
            
            <div className="space-y-2">
              {units.map((unit, index) => (
                <div 
                  key={unit.id} 
                  className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:border-gray-300 dark:hover:border-slate-600 transition-all cursor-pointer group"
                  onClick={() => navigate(`/class/${classId}/unit/${unit.id}`)}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-md bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-700 dark:text-gray-300 font-semibold text-sm">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                          {unit.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                          {unit.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(unit.created_at).toLocaleDateString()}</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/class/${classId}/unit/${unit.id}`);
                            }}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {units.length === 0 && (
                <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 text-center">
                  <BookOpen className="h-10 w-10 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">No Units Yet</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Course units will appear here when they're created.
                  </p>
                  {classInfo.role === 'creator' && (
                    <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                      <Plus className="h-3 w-3 mr-1" />
                      Create Unit
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
