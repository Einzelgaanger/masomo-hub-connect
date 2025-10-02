import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ProfilePictureModal } from "@/components/ui/ProfilePictureModal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Send, 
  Heart, 
  Image, 
  Download, 
  Eye,
  Users,
  MessageCircle,
  Paperclip,
  Trash2
} from "lucide-react";
import { format } from "date-fns";



interface Message {
  id: string;
  content: string;
  message_type: 'text' | 'image';
  media_url?: string;
  media_filename?: string;
  media_size?: number;
  likes_count: number;
  created_at: string;
  user_id: string;
  reply_to_message_id?: string | null;
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

// TikTok-style Image Player Component
function ImagePlayer({ src, message }: { src: string; message: any }) {
  const [showFullscreen, setShowFullscreen] = useState(false);

  const openFullscreen = () => {
    setShowFullscreen(true);
  };

  const closeFullscreen = () => {
    setShowFullscreen(false);
  };

  return (
    <>
      {/* Preview thumbnail - click to open fullscreen */}
      <div 
        className="relative w-full aspect-video bg-black cursor-pointer"
        onClick={openFullscreen}
      >
        <img
          src={src}
          alt="Shared image"
          className="w-full h-full object-cover border-0 outline-none rounded-none shadow-none"
        />
      </div>

      {/* TikTok-style Fullscreen Modal */}
      {showFullscreen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Close button */}
          <div className="absolute top-4 left-4 z-10">
            <Button
              onClick={closeFullscreen}
              className="bg-black/50 hover:bg-black/70 text-white border-0 rounded-full w-10 h-10 p-0"
            >
              ✕
            </Button>
          </div>

          {/* Image takes most of screen */}
          <div className="flex-1 flex items-center justify-center relative">
            <img
              src={src}
              alt="Fullscreen image"
              className="w-full h-full object-contain border-0 outline-none rounded-none shadow-none"
            />
          </div>

          {/* Description at bottom - TikTok style */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6">
            <div className="flex items-start gap-3">
              <ProfilePictureModal
                src={message.profiles?.profile_picture_url}
                fallback={message.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('')}
                alt={message.profiles?.full_name}
                className="h-10 w-10 border-2 border-white/20"
                name={message.profiles?.full_name}
                course={message.profiles?.classes?.course_name}
              />
              <div className="flex-1">
                <p className="text-white/90 text-sm leading-relaxed">
                  {message.content}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
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
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [pendingMessages, setPendingMessages] = useState<Set<string>>(new Set());
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<Message | null>(null);
  const [longPressingMessageId, setLongPressingMessageId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState('');
  const [showFileUploadDialog, setShowFileUploadDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    if (userProfile && userProfile.classes?.university_id) {
      fetchMessages();
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [userProfile?.classes?.university_id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
            course_name,
            university_id
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

        console.log('Simple profile data:', simpleData);
        console.log('User class_id:', simpleData.class_id);

        // If user has no class_id, redirect to Masomo to apply for class
        if (!simpleData.class_id) {
          toast({
            title: "Class Required",
            description: "Please apply for a class first to access the chat room.",
            variant: "destructive",
          });
          window.location.href = '/units';
          return;
        }

        // Fetch class data separately
        const { data: classData, error: classError } = await supabase
          .from('classes_old')
          .select('course_name, university_id')
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

        // Check if user has units in this class (optional check)
        let unitsData = null;
        if (simpleData.class_id) {
          const { data, error: unitsError } = await supabase
            .from('units')
            .select('id')
            .eq('class_id', simpleData.class_id)
            .limit(1);

          if (unitsError) {
            console.warn('Error fetching units (non-critical):', unitsError);
            // Don't block access if units check fails - just log the warning
          } else {
            unitsData = data;
          }
        }

        // Only redirect if we successfully checked units and found none
        // If units check failed, allow access anyway
        if (unitsData && unitsData.length === 0) {
          toast({
            title: "No Units Available",
            description: "Please apply for a class first to access the chat room.",
            variant: "destructive",
          });
          window.location.href = '/units';
          return;
        }

        setUserProfile({
          ...simpleData,
          classes: classData
        });
      } else {
        console.log('Complex profile data:', data);
        console.log('User class_id:', data.class_id);
        console.log('User classes:', data.classes);
        
        // Check if user has units in this class (optional check)
        let unitsData = null;
        if (data.classes?.id) {
          const { data, error: unitsError } = await supabase
            .from('units')
            .select('id')
            .eq('class_id', data.classes.id)
            .limit(1);

          if (unitsError) {
            console.warn('Error fetching units (non-critical):', unitsError);
            // Don't block access if units check fails - just log the warning
          } else {
            unitsData = data;
          }
        }

        // Only redirect if we successfully checked units and found none
        // If units check failed, allow access anyway
        if (unitsData && unitsData.length === 0) {
          toast({
            title: "No Units Available",
            description: "Please apply for a class first to access the chat room.",
            variant: "destructive",
          });
          window.location.href = '/units';
          return;
        }

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

  const fetchMessages = async () => {
    try {
      // First try the full query with relationships
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

      if (error) {
        console.warn('Full query failed, trying simplified query:', error);
        // Fallback to simplified query without relationships
        const { data: simpleData, error: simpleError } = await supabase
          .from('messages')
          .select('*')
          .eq('university_id', userProfile?.classes?.university_id)
          .order('created_at', { ascending: true });

        if (simpleError) throw simpleError;
        
        // Manually fetch profile data for each message
        const messagesWithProfiles = await Promise.all(
          simpleData.map(async (message) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select(`
                full_name,
                profile_picture_url,
                character_id,
                classes(course_name)
              `)
              .eq('user_id', message.user_id)
              .single();

            const { data: likes } = await supabase
              .from('message_likes')
              .select('user_id')
              .eq('message_id', message.id);

            return {
              ...message,
              profiles: profile,
              message_likes: likes || []
            };
          })
        );
        
        setMessages(messagesWithProfiles);
      } else {
        setMessages(data || []);
      }
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

    console.log('Setting up Ukumbi real-time subscription for university:', userProfile.classes.university_id);

    const channel = supabase
      .channel(`ukumbi-messages-${userProfile.classes.university_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `university_id=eq.${userProfile.classes.university_id}`
        },
        (payload) => {
          console.log('New message received via real-time:', payload.new);
          // Only fetch if it's not from current user (to avoid duplicates)
          if (payload.new.user_id !== user?.id) {
            fetchNewMessage(payload.new.id);
          }
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
          console.log('Message updated via real-time:', payload.new);
          setMessages(prev => 
            prev.map(msg => 
              msg.id === payload.new.id 
                ? { ...msg, likes_count: payload.new.likes_count }
                : msg
            )
          );
        }
      )
      .subscribe((status) => {
        console.log('Ukumbi subscription status:', status);
      });

    return () => {
      console.log('Cleaning up Ukumbi real-time subscription');
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

    const messageContent = newMessage.trim();
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    
    // Create optimistic message
    const optimisticMessage: Message = {
      id: tempId,
      user_id: user?.id!,
      university_id: userProfile.classes.university_id,
      content: messageContent,
      message_type: 'text',
      media_url: null,
      media_filename: null,
      media_size: null,
      likes_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reply_to_message_id: replyingTo?.id || null,
      profiles: {
        full_name: userProfile.full_name,
        profile_picture_url: userProfile.profile_picture_url,
        classes: {
          course_name: userProfile.classes.course_name
        }
      },
      message_likes: []
    };

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);
    setPendingMessages(prev => new Set([...prev, tempId]));
    setNewMessage("");
    setReplyingTo(null);
    
    // Scroll to bottom immediately
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    setSending(true);
    try {
      // Try to insert with relationships first
      const { data, error } = await supabase
        .from('messages')
        .insert({
          user_id: user?.id,
          university_id: userProfile.classes.university_id,
          content: messageContent,
          message_type: 'text',
          reply_to_message_id: replyingTo?.id || null
        })
        .select(`
          *,
          profiles(full_name, profile_picture_url, classes(course_name)),
          message_likes(user_id)
        `)
        .single();

      if (error) {
        console.warn('Insert with relationships failed, trying simple insert:', error);
        // Fallback to simple insert
        const { data: simpleData, error: simpleError } = await supabase
          .from('messages')
          .insert({
            user_id: user?.id,
            university_id: userProfile.classes.university_id,
            content: messageContent,
            message_type: 'text',
            reply_to_message_id: replyingTo?.id || null
          })
          .select('*')
          .single();

        if (simpleError) throw simpleError;

        // Manually fetch profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select(`
            full_name,
            profile_picture_url,
            character_id,
            classes(course_name)
          `)
          .eq('user_id', user?.id)
          .single();

        const messageWithProfile = {
          ...simpleData,
          profiles: profile,
          message_likes: []
        };

        // Replace optimistic message with real message
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? messageWithProfile : msg
        ));
      } else {
        // Replace optimistic message with real message
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? data : msg
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove failed message
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setPendingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempId);
        return newSet;
      });
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile?.classes?.university_id) return;

    // Only allow images
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Only image files are allowed in chat",
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
    if (!selectedFile || !userProfile?.classes?.university_id || uploading) return;

    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const messageType = 'image'; // Only images allowed
    const fileIcon = '📷';
    const content = fileDescription.trim() 
      ? `${fileIcon} ${fileDescription.trim()}`
      : `${fileIcon}`;
    
    // Generate a better display name for optimistic message
    const originalName = selectedFile.name;
    const fileExt = selectedFile.name.split('.').pop();
    const displayName = originalName.length > 20 
      ? `${originalName.substring(0, 17)}...${fileExt}` 
      : originalName;

    // Create optimistic message for file upload
    const optimisticMessage: Message = {
      id: tempId,
      user_id: user?.id!,
      university_id: userProfile.classes.university_id,
      content: content,
      message_type: messageType,
      media_url: null, // Will be updated when upload completes
      media_filename: displayName,
      media_size: selectedFile.size,
      likes_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reply_to_message_id: replyingTo?.id || null,
      profiles: {
        full_name: userProfile.full_name,
        profile_picture_url: userProfile.profile_picture_url,
        classes: {
          course_name: userProfile.classes.course_name
        }
      },
      message_likes: []
    };

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);
    setPendingMessages(prev => new Set([...prev, tempId]));
    
    // Close dialog and clear state
    setShowFileUploadDialog(false);
    setSelectedFile(null);
    setFileDescription('');
    
    // Scroll to bottom immediately
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // Generate a better display name
      const originalName = selectedFile.name;
      const displayName = originalName.length > 20 
        ? `${originalName.substring(0, 17)}...${fileExt}` 
        : originalName;

      // Upload image to storage
      const { error: uploadError } = await supabase.storage
        .from('ukumbi-images')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('ukumbi-images')
        .getPublicUrl(filePath);

      // Insert message
      const { data, error: messageError } = await supabase
        .from('messages')
        .insert({
          user_id: user?.id,
          university_id: userProfile.classes.university_id,
          content: content,
          message_type: messageType,
          media_url: publicUrl,
          media_filename: displayName,
          media_size: selectedFile.size,
          reply_to_message_id: replyingTo?.id || null
        })
        .select(`
          *,
          profiles(full_name, profile_picture_url, classes(course_name)),
          message_likes(user_id)
        `)
        .single();

      if (messageError) throw messageError;

      // Replace optimistic message with real message
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? data : msg
      ));

      toast({
        title: "Media shared!",
        description: "Your file has been shared successfully",
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Remove failed message
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      
      toast({
        title: "Upload failed",
        description: "Failed to share media",
        variant: "destructive",
      });
    } finally {
      setPendingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempId);
        return newSet;
      });
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

  // Swipe to reply functionality
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent, message: Message) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchEnd = (e: React.TouchEvent, message: Message) => {
    if (!touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isVerticalSwipe = Math.abs(distanceY) > Math.abs(distanceX);

    if (isLeftSwipe && !isVerticalSwipe) {
      // Swipe left to reply
      setReplyingTo(message);
    } else if (isRightSwipe && !isVerticalSwipe) {
      // Swipe right to reply (alternative)
      setReplyingTo(message);
    }
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  // Long press to delete functionality
  const handleLongPress = (message: Message) => {
    if (message.user_id === user?.id) {
      // Provide haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      setShowDeleteDialog(message);
      
      toast({
        title: "Delete Message",
        description: "Long press detected. Confirm deletion in the dialog.",
      });
    }
  };

  const handleLongPressStart = (e: React.TouchEvent | React.MouseEvent, message: Message) => {
    e.preventDefault();
    if (message.user_id === user?.id) {
      setLongPressingMessageId(message.id);
      const timer = setTimeout(() => {
        handleLongPress(message);
        setLongPressingMessageId(null);
      }, 500); // 500ms long press
      setLongPressTimer(timer);
    }
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
      setLongPressingMessageId(null);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      // Remove from UI immediately (optimistic update)
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      // Delete from database
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: "Message deleted",
        description: "Your message has been deleted",
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      
      // Refresh messages to restore if deletion failed
      if (userProfile?.classes?.university_id) {
        fetchMessages();
      }
      
      toast({
        title: "Delete failed",
        description: "Failed to delete message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(null);
    }
  };

  // Jumping dots loading component
  const JumpingDots = () => (
    <div className="flex items-center space-x-1">
      <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:0ms]"></div>
      <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:150ms]"></div>
      <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:300ms]"></div>
    </div>
  );

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

      {/* Messages Area - scrolls under fixed global header */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-1 sm:p-4 space-y-4">
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
                    <ProfilePictureModal
                      src={message.profiles.profile_picture_url}
                      fallback={message.profiles.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      alt={message.profiles.full_name}
                      className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
                      name={message.profiles.full_name}
                      course={message.profiles.classes.course_name}
                    />

                    <div
                      className={`max-w-[75%] sm:max-w-[70%] space-y-1 ${
                        message.user_id === user?.id ? 'items-end' : 'items-start'
                      } flex flex-col group`}
                    >
                      {/* Message Header - Only timestamp now */}
                      <div className={`flex items-center gap-2 text-xs text-muted-foreground ${
                        message.user_id === user?.id ? 'flex-row-reverse' : 'flex-row'
                      }`}>
                        <span>{format(new Date(message.created_at), 'HH:mm')}</span>
                      </div>

                      {/* Message Content */}
                      <div
                        className={`px-3 py-2 rounded-2xl relative transition-all duration-200 ${
                          message.user_id === user?.id
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted rounded-bl-md'
                        } ${
                          longPressingMessageId === message.id
                            ? 'scale-95 opacity-80 shadow-lg'
                            : ''
                        }`}
                        onDoubleClick={() => toggleLike(message.id)}
                        onTouchStart={(e) => {
                          onTouchStart(e, message);
                          handleLongPressStart(e, message);
                        }}
                        onTouchMove={(e) => {
                          onTouchMove(e);
                          handleLongPressEnd();
                        }}
                        onTouchEnd={(e) => {
                          onTouchEnd(e, message);
                          handleLongPressEnd();
                        }}
                        onMouseDown={(e) => {
                          handleLongPressStart(e, message);
                        }}
                        onMouseUp={handleLongPressEnd}
                        onMouseLeave={handleLongPressEnd}
                        title={message.user_id === user?.id ? "Long press to delete" : ""}
                      >
                        {message.reply_to_message_id && (
                          <div className="mb-2 p-2 bg-muted/30 rounded border-l-2 border-primary/50">
                            <p className="text-xs text-muted-foreground">Replying to a message</p>
                          </div>
                        )}
                        {message.message_type === 'text' ? (
                          <div className="flex items-center gap-2">
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            {pendingMessages.has(message.id) && (
                              <JumpingDots />
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Media display - NO BORDERS */}
                            {message.message_type === 'image' && (
                              <ImagePlayer 
                                src={message.media_url}
                                message={message}
                              />
                            )}
                            
                            {/* Message content text - ALWAYS BELOW MEDIA */}
                            <div className="flex items-center gap-2">
                              <p className="text-sm">{message.content}</p>
                              {pendingMessages.has(message.id) && (
                                <JumpingDots />
                              )}
                            </div>
                          </div>
                        )}

                        {/* Like Badge */}
                        {message.likes_count > 0 && (
                          <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
                            <Heart className="h-2 w-2 fill-current" />
                          </div>
                        )}

                        {/* Delete Indicator (for user's own messages) */}
                        {message.user_id === user?.id && (
                          <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center shadow-lg cursor-pointer">
                            <Trash2 className="h-2 w-2" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

        {/* Reply Preview */}
        {replyingTo && (
          <div className="flex-shrink-0 border-t bg-muted/50 p-3">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Replying to {replyingTo.profiles.full_name}</p>
                <p className="text-sm truncate">{replyingTo.content}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={cancelReply}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="flex-shrink-0 border-t bg-background p-4">
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
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            title="Upload image file"
          />
        </div>
      </div>

      {/* File Upload Dialog */}
      {showFileUploadDialog && selectedFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Share File</h3>
            
            {/* File Info */}
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {selectedFile.type.startsWith('image/') ? '📷' : '🎥'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>

            {/* Description Input */}
            <div className="mb-4">
              <label htmlFor="file-description" className="block text-sm font-medium mb-2">
                Add a description (optional)
              </label>
              <textarea
                id="file-description"
                value={fileDescription}
                onChange={(e) => setFileDescription(e.target.value)}
                placeholder="Describe what this file is about..."
                className="w-full p-3 border border-input rounded-lg resize-none"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {fileDescription.length}/500 characters
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowFileUploadDialog(false);
                  setSelectedFile(null);
                  setFileDescription('');
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleFileUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Uploading...
                  </div>
                ) : (
                  'Share'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Delete Message</h3>
            <p className="text-muted-foreground mb-4">
              Are you sure you want to delete this message? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMessage(showDeleteDialog.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
