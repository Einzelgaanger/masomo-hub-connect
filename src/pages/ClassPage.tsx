import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (classId) {
      fetchClassData();
      setupRealtimeSubscription();
    }
  }, [classId]);

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
            created_at,
            profiles!inner(
              full_name,
              profile_picture_url
            )
          `)
          .eq('class_id', classId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (messagesError) {
          console.warn('Chat messages not accessible:', messagesError);
          setMessages([]); // Set empty array if table doesn't exist
        } else {
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
          const newMessage = payload.new as any;
          setMessages(prev => [...prev, {
            id: newMessage.id,
            sender_id: newMessage.sender_id,
            message: newMessage.message,
            message_type: newMessage.message_type,
            file_url: newMessage.file_url,
            file_name: newMessage.file_name,
            created_at: newMessage.created_at,
            sender_name: 'You',
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
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Classes
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{classInfo.name}</h1>
              <p className="text-muted-foreground">{classInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Class Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{units.length}</p>
                  <p className="text-sm text-muted-foreground">Units</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{classInfo.members_count}</p>
                  <p className="text-sm text-muted-foreground">Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{messages.length}</p>
                  <p className="text-sm text-muted-foreground">Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Units Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Course Units</h2>
              <Badge variant="outline" className="text-xs">
                {classInfo.class_code}
              </Badge>
            </div>
            
            <div className="space-y-4">
              {units.map((unit, index) => (
                <Card 
                  key={unit.id} 
                  className="hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-primary/20"
                  onClick={() => navigate(`/class/${classId}/unit/${unit.id}`)}
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
                <Card>
                  <CardContent className="p-8 text-center">
                    <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Units Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Course units will appear here when they're created.
                    </p>
                    {classInfo.role === 'creator' && (
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Unit
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Chat Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Class Chat</h2>
              <Button
                onClick={() => setShowChat(!showChat)}
                variant={showChat ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                {showChat ? 'Hide Chat' : 'Show Chat'}
              </Button>
            </div>

            {showChat && (
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Class Discussion
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Messages Area */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <h3 className="text-sm font-semibold mb-1">Start the Conversation</h3>
                          <p className="text-xs text-muted-foreground">
                            Be the first to send a message in this class.
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
                            <Avatar className="h-6 w-6 flex-shrink-0">
                              <AvatarImage src={message.sender_avatar} />
                              <AvatarFallback className="text-xs">
                                {message.sender_name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`flex-1 max-w-[80%] ${
                              message.sender_id === user?.id ? 'text-right' : ''
                            }`}>
                              <div className={`inline-block p-2 rounded-lg text-sm ${
                                message.sender_id === user?.id 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-muted'
                              }`}>
                                {message.message}
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
                  <div className="border-t p-3">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type a message..."
                          className="pr-10 h-9 text-sm"
                          disabled={sending}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        >
                          <Smile className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending}
                        size="sm"
                        className="h-9 px-3"
                      >
                        {sending ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
