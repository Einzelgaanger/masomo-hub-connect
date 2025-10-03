import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, 
  BookOpen, 
  Users, 
  Send, 
  Smile, 
  Paperclip,
  MoreVertical,
  Clock,
  CheckCircle2,
  ChevronRight,
  Play,
  Download,
  Star,
  Plus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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

interface EnhancedClassroomProps {
  classId: string;
  className: string;
  onClose: () => void;
}

export function EnhancedClassroom({ classId, className, onClose }: EnhancedClassroomProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('chat');
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

  const fetchClassData = async () => {
    try {
      setLoading(true);
      
      // Fetch units
      const { data: unitsData, error: unitsError } = await supabase
        .from('class_units')
        .select('*')
        .eq('class_id', classId)
        .order('order_index', { ascending: true });

      if (unitsError) throw unitsError;
      setUnits(unitsData || []);

      // Fetch recent messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('class_chat_messages')
        .select(`
          id,
          sender_id,
          message,
          message_type,
          file_url,
          file_name,
          created_at,
          profiles!inner(
            full_name,
            profile_picture_url
          )
        `)
        .eq('class_id', classId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (messagesError) throw messagesError;

      const formattedMessages = messagesData?.map(msg => ({
        id: msg.id,
        sender_id: msg.sender_id,
        message: msg.message,
        message_type: msg.message_type,
        file_url: msg.file_url,
        file_name: msg.file_name,
        created_at: msg.created_at,
        sender_name: msg.profiles?.full_name || 'Unknown',
        sender_avatar: msg.profiles?.profile_picture_url
      })) || [];

      setMessages(formattedMessages.reverse());
    } catch (error) {
      console.error('Error fetching class data:', error);
      toast({
        title: "Error",
        description: "Failed to load class data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`class-chat-${classId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'class_chat_messages',
          filter: `class_id=eq.${classId}`
        },
        (payload) => {
          // Add new message to the list
          const newMessage = payload.new as any;
          setMessages(prev => [...prev, {
            id: newMessage.id,
            sender_id: newMessage.sender_id,
            message: newMessage.message,
            message_type: newMessage.message_type,
            file_url: newMessage.file_url,
            file_name: newMessage.file_name,
            created_at: newMessage.created_at,
            sender_name: 'You', // Will be updated with real name
            sender_avatar: undefined
          }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const { error } = await supabase
        .from('class_chat_messages')
        .insert({
          class_id: classId,
          sender_id: user?.id,
          message: newMessage.trim(),
          message_type: 'text'
        });

      if (error) throw error;

      setNewMessage('');
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
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-full max-w-6xl h-[90vh] m-4">
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading classroom...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl h-[90vh] shadow-2xl border-0">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">{className}</CardTitle>
                <p className="text-sm text-muted-foreground">Interactive Classroom</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 h-[calc(100%-5rem)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <div className="border-b">
              <TabsList className="grid w-full grid-cols-4 h-12 bg-transparent">
                <TabsTrigger value="chat" className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Chat</span>
                </TabsTrigger>
                <TabsTrigger value="units" className="flex items-center gap-2 text-sm font-medium">
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Units</span>
                </TabsTrigger>
                <TabsTrigger value="materials" className="flex items-center gap-2 text-sm font-medium">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Materials</span>
                </TabsTrigger>
                <TabsTrigger value="members" className="flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Members</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Chat Tab */}
            <TabsContent value="chat" className="h-[calc(100%-3rem)] m-0 p-0">
              <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
                {/* Messages Area */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Start the Conversation</h3>
                        <p className="text-muted-foreground">
                          Be the first to send a message in this classroom.
                        </p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${
                            message.sender_id === user?.id ? 'flex-row-reverse' : ''
                          }`}
                        >
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={message.sender_avatar} />
                            <AvatarFallback className="text-xs">
                              {message.sender_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`flex-1 max-w-[70%] ${
                            message.sender_id === user?.id ? 'text-right' : ''
                          }`}>
                            <div className={`inline-block p-3 rounded-2xl shadow-sm ${
                              message.sender_id === user?.id 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-white dark:bg-slate-700 border'
                            }`}>
                              <p className="text-sm leading-relaxed">{message.message}</p>
                              {message.file_name && (
                                <div className="mt-2 p-2 bg-background/50 rounded-lg">
                                  <Paperclip className="h-4 w-4 inline mr-1" />
                                  <span className="text-xs">{message.file_name}</span>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {message.sender_name} • {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t bg-white dark:bg-slate-800 p-4">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message to your classmates..."
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
              </div>
            </TabsContent>

            {/* Units Tab */}
            <TabsContent value="units" className="h-[calc(100%-3rem)] m-0 p-4">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  {units.map((unit, index) => (
                    <Card 
                      key={unit.id} 
                      className="hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-primary/20"
                      onClick={() => {
                        // Here you can add logic to open the unit content
                        console.log('Opening unit:', unit.name);
                        // You could set a selected unit state or navigate to unit content
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                {unit.name}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">{unit.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>Created {new Date(unit.created_at).toLocaleDateString()}</span>
                                </div>
                                {unit.is_completed && (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>Completed</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {unit.materials_count || 0} materials
                            </Badge>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Start
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {units.length === 0 && (
                    <div className="text-center py-12">
                      <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Units Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Course units will appear here when they're created.
                      </p>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Unit
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Materials Tab */}
            <TabsContent value="materials" className="h-[calc(100%-3rem)] m-0 p-4">
              <div className="text-center py-12">
                <Download className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Course Materials</h3>
                <p className="text-muted-foreground">
                  Course materials and resources will be available here.
                </p>
              </div>
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members" className="h-[calc(100%-3rem)] m-0 p-4">
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Class Members</h3>
                <p className="text-muted-foreground">
                  Class member list will be displayed here.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
