import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, 
  Send, 
  Search,
  User,
  ArrowLeft,
  MoreHorizontal,
  Paperclip,
  Image
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { AppLayout } from "@/components/layout/AppLayout";

interface Conversation {
  participant_id: string;
  participant_name: string;
  participant_email: string;
  participant_avatar: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  media_url?: string;
  media_filename?: string;
  media_type?: 'image';
  profiles: {
    full_name: string;
    profile_picture_url: string;
  };
}

const Inbox = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(conversationId || null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState('');
  const [showFileUploadDialog, setShowFileUploadDialog] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchConversations();
      if (conversationId) {
        fetchMessages(conversationId);
      }
    }
  }, [user, conversationId]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
      setupRealtimeSubscription();
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (searchQuery.trim() && userProfile?.classes?.university_id) {
      const timeoutId = setTimeout(() => {
        searchUsers(searchQuery.trim());
      }, 300); // 300ms debounce
      
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, userProfile]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchUserProfile = async () => {
    try {
      // First try the full query with inner join
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          classes!inner(
            *,
            universities(*)
          )
        `)
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.log('Full profile query failed, trying simple query:', error);
        
        // Fallback to simple query without inner join
        const { data: simpleData, error: simpleError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user?.id)
          .single();

        if (simpleError) throw simpleError;

        // If user has no class_id, redirect to class selection
        if (!simpleData.class_id) {
          toast({
            title: "Class Required",
            description: "Please select a class to access messages.",
            variant: "destructive",
          });
          window.location.href = '/class-selection';
          return;
        }

        // Fetch class data separately
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select(`
            *,
            universities(*)
          `)
          .eq('id', simpleData.class_id)
          .single();

        if (classError) {
          console.error('Error fetching class data:', classError);
          toast({
            title: "Error",
            description: "Failed to load class information.",
            variant: "destructive",
          });
          return;
        }

        setUserProfile({
          ...simpleData,
          classes: classData
        });
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const searchUsers = async (query: string) => {
    if (!userProfile?.classes?.university_id) return;

    setSearchingUsers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          profile_picture_url,
          classes!inner (
            university_id,
            course_name,
            universities (
              name
            )
          )
        `)
        .eq('classes.university_id', userProfile.classes.university_id)
        .neq('user_id', user?.id)
        .ilike('full_name', `%${query}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for users.",
        variant: "destructive",
      });
    } finally {
      setSearchingUsers(false);
    }
  };

  const startConversation = async (userId: string) => {
    try {
      setSelectedConversation(userId);
      navigate(`/inbox/${userId}`);
      setSearchQuery("");
      setSearchResults([]);
      
      toast({
        title: "Conversation Started",
        description: "You can now start messaging this user.",
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation.",
        variant: "destructive",
      });
    }
  };

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_conversation_participants', { user_id_param: user?.id });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (participantId: string) => {
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          profiles!direct_messages_sender_id_fkey(full_name, profile_picture_url)
        `)
        .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${participantId}),and(sender_id.eq.${participantId},receiver_id.eq.${user?.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Mark messages as read
      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('receiver_id', user?.id)
        .eq('sender_id', participantId)
        .eq('is_read', false);

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages.",
        variant: "destructive",
      });
    }
  };

  const setupRealtimeSubscription = () => {
    if (!selectedConversation) return;

    const subscription = supabase
      .channel('direct_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `or(sender_id.eq.${selectedConversation},receiver_id.eq.${selectedConversation})`
        },
        (payload) => {
          if (payload.new.sender_id === user?.id || payload.new.receiver_id === user?.id) {
            fetchMessages(selectedConversation);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedConversation,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage("");
      fetchMessages(selectedConversation);
      fetchConversations(); // Refresh conversations to update last message
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;

    // Only allow images
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Only image files are allowed in messages",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 5MB for images)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setFileDescription('');
    setShowFileUploadDialog(true);
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedConversation || !user || uploading) return;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // Upload image to storage
      const { error: uploadError } = await supabase.storage
        .from('inbox-images')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('inbox-images')
        .getPublicUrl(filePath);

      // Create message content
      const content = fileDescription.trim() 
        ? `📷 ${fileDescription.trim()}`
        : '📷';

      // Insert message with image
      const { error: messageError } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedConversation,
          content: content,
          media_url: publicUrl,
          media_filename: selectedFile.name,
          media_type: 'image'
        });

      if (messageError) throw messageError;

      // Close dialog and clear state
      setShowFileUploadDialog(false);
      setSelectedFile(null);
      setFileDescription('');
      
      // Refresh messages
      fetchMessages(selectedConversation);
      fetchConversations();

      toast({
        title: "Image sent",
        description: "Your image has been sent successfully",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to send image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participant_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter out users who already have conversations from search results
  const availableSearchResults = searchResults.filter(user => 
    !conversations.some(conv => conv.participant_id === user.user_id)
  );

  const selectedConvData = conversations.find(conv => conv.participant_id === selectedConversation);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-[calc(100vh-4rem)] flex">
        {/* Conversations Sidebar */}
        <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r bg-background flex-col`}>
          <div className="p-4 border-b">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="h-6 w-6" />
              <h1 className="text-xl font-bold">Inbox</h1>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations or find new people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {filteredConversations.length === 0 && availableSearchResults.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchQuery ? 'No users found' : 'No conversations yet'}
              </div>
            ) : (
              <div className="p-2">
                {/* Existing Conversations */}
                {filteredConversations.map((conversation) => (
                  <Card
                    key={conversation.participant_id}
                    className={`mb-2 cursor-pointer transition-colors ${
                      selectedConversation === conversation.participant_id
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => {
                      setSelectedConversation(conversation.participant_id);
                      navigate(`/inbox/${conversation.participant_id}`);
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={conversation.participant_avatar} />
                            <AvatarFallback>
                              {conversation.participant_name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.unread_count > 0 && (
                            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{conversation.participant_name}</p>
                            <span className="text-xs text-muted-foreground">
                              {conversation.last_message_time && 
                                formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: true })
                              }
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.last_message}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Search Results */}
                {availableSearchResults.length > 0 && (
                  <>
                    <div className="px-3 py-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {searchingUsers ? 'Searching...' : 'Start New Conversation'}
                      </p>
                    </div>
                    {availableSearchResults.map((user) => (
                      <Card
                        key={user.user_id}
                        className="mb-2 cursor-pointer transition-colors hover:bg-muted/50"
                        onClick={() => startConversation(user.user_id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.profile_picture_url} />
                              <AvatarFallback>
                                {user.full_name.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium truncate">{user.full_name}</p>
                                <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                                  Message
                                </Button>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {user.classes?.course_name} • {user.classes?.universities?.name}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Messages Area */}
        <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-background flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedConvData && (
                    <button className="flex items-center gap-2" onClick={() => navigate(`/profile/${selectedConvData.participant_id}`)}>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={selectedConvData.participant_avatar} />
                        <AvatarFallback>
                          {selectedConvData.participant_name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-medium leading-none">{selectedConvData.participant_name}</p>
                        <p className="text-sm text-muted-foreground">{selectedConvData.participant_email}</p>
                      </div>
                    </button>
                  )}
                </div>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={messagesRef}>
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isOwnMessage = message.sender_id === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex gap-2 max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                          {!isOwnMessage && (
                            <Avatar className="h-8 w-8 mt-1">
                              <AvatarImage src={message.profiles?.profile_picture_url} />
                              <AvatarFallback>
                                {message.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`rounded-lg px-3 py-2 ${
                            isOwnMessage 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}>
                            {/* Image display */}
                            {message.media_url && message.media_type === 'image' && (
                              <div className="mb-2">
                                <img 
                                  src={message.media_url} 
                                  alt={message.media_filename || 'Image'}
                                  className="max-w-xs max-h-64 rounded-lg object-cover cursor-pointer"
                                  onClick={() => window.open(message.media_url, '_blank')}
                                />
                              </div>
                            )}
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}>
                              {format(new Date(message.created_at), 'HH:mm')}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t bg-background">
                <div className="flex items-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="h-10 w-10 p-0"
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    ) : (
                      <Paperclip className="h-4 w-4" />
                    )}
                  </Button>
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 resize-none"
                    rows={1}
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim() || sending}
                    size="sm"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  title="Upload image file"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose a conversation from the sidebar to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* File Upload Dialog */}
      {showFileUploadDialog && selectedFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <Image className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Send Image</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <img 
                  src={URL.createObjectURL(selectedFile)} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Add a caption (optional)</label>
                <Textarea
                  value={fileDescription}
                  onChange={(e) => setFileDescription(e.target.value)}
                  placeholder="Describe your image..."
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowFileUploadDialog(false);
                  setSelectedFile(null);
                  setFileDescription('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleFileUpload} 
                disabled={uploading}
                className="flex-1"
              >
                {uploading ? "Sending..." : "Send Image"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Inbox;
