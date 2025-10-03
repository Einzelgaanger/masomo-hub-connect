import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Image as ImageIcon, 
  Download, 
  Eye,
  Users,
  MessageCircle,
  Paperclip,
  Trash2,
  Video,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Plus,
  X,
  Check,
  CheckCheck,
  Clock,
  Loader2,
  Smile,
  Reply,
  MoreVertical,
  File as FileIcon
} from "lucide-react";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";



interface Message {
  id: string;
  content: string;
  message_type: 'text' | 'image' | 'video' | 'file';
  media_url?: string;
  media_filename?: string;
  media_size?: number;
  media_duration?: number; // For videos
  media_thumbnail?: string; // For video thumbnails
  likes_count: number;
  created_at: string;
  user_id: string;
  reply_to_message_id?: string | null;
  delivery_status?: 'sending' | 'sent' | 'delivered' | 'read';
  profiles: {
    full_name: string;
    profile_picture_url?: string;
    character_id?: string;
    classes?: {
      course_name: string;
    };
  };
  message_likes: {
    user_id: string;
  }[];
  reply_message?: {
    id: string;
    content: string;
    message_type: 'text' | 'image' | 'video' | 'file';
    media_filename?: string;
    created_at: string;
    profiles: {
      full_name: string;
      profile_picture_url?: string;
    };
  } | null;
}

// Ultra-Modern Media Player Components
function MediaPlayer({ 
  message, 
  currentlyPlayingVideo, 
  setCurrentlyPlayingVideo 
}: { 
  message: Message;
  currentlyPlayingVideo: string | null;
  setCurrentlyPlayingVideo: (videoId: string | null) => void;
}) {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isThisVideoPlaying = currentlyPlayingVideo === message.id;

  // Sync local playing state with global state
  useEffect(() => {
    if (videoRef.current) {
      if (isThisVideoPlaying && !isPlaying) {
        setIsPlaying(true);
      } else if (!isThisVideoPlaying && isPlaying) {
        setIsPlaying(false);
        videoRef.current.pause();
      }
    }
  }, [isThisVideoPlaying, isPlaying]);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isThisVideoPlaying) {
        // Pause this video
        videoRef.current.pause();
        setIsPlaying(false);
        setCurrentlyPlayingVideo(null);
      } else {
        // Pause any other playing video first
        if (currentlyPlayingVideo) {
          // Find and pause the other video
          const otherVideo = document.querySelector(`video[data-message-id="${currentlyPlayingVideo}"]`) as HTMLVideoElement;
          if (otherVideo) {
            otherVideo.pause();
          }
        }
        
        // Play this video
        videoRef.current.play();
        setIsPlaying(true);
        setCurrentlyPlayingVideo(message.id);
      }
    }
  }, [isThisVideoPlaying, currentlyPlayingVideo, message.id, setCurrentlyPlayingVideo]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (message.message_type === 'image') {
  return (
      <div className="group relative">
      <div 
          className="relative rounded-2xl overflow-hidden cursor-pointer max-w-sm shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
          onClick={() => setShowFullscreen(true)}
      >
        <img
            src={message.media_url} 
            alt={message.media_filename || "Shared image"}
            className="w-full h-auto object-cover transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-white/20 backdrop-blur-md rounded-full p-3 border border-white/20">
              <Maximize className="h-5 w-5 text-white" />
            </div>
          </div>
      </div>

      {showFullscreen && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="relative max-w-full max-h-full">
              <img 
                src={message.media_url} 
                alt={message.media_filename || "Shared image"}
                className="max-w-full max-h-full object-contain rounded-xl"
              />
              <button
                onClick={() => setShowFullscreen(false)}
                className="absolute top-4 right-4 bg-black/50 backdrop-blur-md rounded-full p-3 text-white hover:bg-black/70 transition-all duration-200 border border-white/20"
                title="Close fullscreen"
                aria-label="Close fullscreen"
              >
                <X className="h-5 w-5" />
              </button>
          </div>
          </div>
        )}
      </div>
    );
  }

  if (message.message_type === 'video') {
    return (
      <div className="group relative">
        <div className="relative rounded-2xl overflow-hidden max-w-md shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
          <video
            ref={videoRef}
            data-message-id={message.id}
            src={message.media_url}
            className="w-full h-auto object-cover"
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            poster={message.media_thumbnail}
          />
          
          {/* Video Controls Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={togglePlay}
                className="bg-white/20 backdrop-blur-md rounded-full p-4 hover:bg-white/30 transition-all duration-200 border border-white/20"
                title={isPlaying ? "Pause video" : "Play video"}
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8 text-white" />
                ) : (
                  <Play className="h-8 w-8 text-white ml-1" />
                )}
              </button>
          </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-gray-300 transition-colors p-1"
                  title={isMuted ? "Unmute video" : "Mute video"}
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </button>
                
                <div className="flex-1 bg-white/20 rounded-full h-1.5 backdrop-blur-sm">
                  <div 
                    className="bg-white rounded-full h-1.5 transition-all duration-100"
                    style={{ width: `${Math.min(100, Math.max(0, (currentTime / duration) * 100))}%` }}
                  />
              </div>
                
                <span className="text-white text-sm font-medium bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                
                <button
                  onClick={() => setShowFullscreen(true)}
                  className="text-white hover:text-gray-300 transition-colors p-1"
                  title="Fullscreen"
                >
                  <Maximize className="h-5 w-5" />
                </button>
            </div>
          </div>
        </div>
        </div>

        {showFullscreen && (
          <div className="fixed inset-0 bg-black z-50 flex items-center justify-center animate-in fade-in duration-300">
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                src={message.media_url}
                controls
                autoPlay
                className="max-w-full max-h-full object-contain rounded-xl"
                poster={message.media_thumbnail}
              />
              <button
                onClick={() => setShowFullscreen(false)}
                className="absolute top-4 right-4 bg-black/50 backdrop-blur-md rounded-full p-3 text-white hover:bg-black/70 transition-all duration-200 border border-white/20"
                title="Close fullscreen"
                aria-label="Close fullscreen"
              >
                <X className="h-5 w-5" />
              </button>
          </div>
        </div>
      )}
      </div>
  );
  }

  return null;
}

export default function Ukumbi() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [pendingMediaFiles, setPendingMediaFiles] = useState<File[]>([]);
  const [currentlyPlayingVideo, setCurrentlyPlayingVideo] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [pendingMessages, setPendingMessages] = useState<Set<string>>(new Set());
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<Message | null>(null);
  const [longPressingMessageId, setLongPressingMessageId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    if (userProfile) {
      // Fetch messages regardless of class membership
      // If user has class, fetch class-specific messages
      // If no class, fetch general messages or show empty state
      fetchMessages();
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [userProfile]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Pause videos when scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (currentlyPlayingVideo) {
        setCurrentlyPlayingVideo(null);
      }
    };

    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.addEventListener('scroll', handleScroll);
      return () => messagesContainer.removeEventListener('scroll', handleScroll);
    }
  }, [currentlyPlayingVideo]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Smart time formatting like Slack
  const formatMessageTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'h:mm a')}`;
    } else if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return format(date, 'EEE h:mm a');
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  }, []);

  // Typing indicator handler
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      // TODO: Send typing indicator to other users via real-time
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      // TODO: Stop typing indicator
    }, 2000);
  }, [isTyping]);

  // File upload handlers
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const validFiles = Array.from(files).filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB for video, 10MB for images
      
      if (!isImage && !isVideo) {
          toast({
          title: "Invalid file type",
          description: "Please select images or videos only.",
            variant: "destructive",
          });
        return false;
      }
      
      if (file.size > maxSize) {
          toast({
          title: "File too large",
          description: `${file.name} is too large. Max size: ${isVideo ? '100MB' : '10MB'}`,
            variant: "destructive",
          });
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length > 0) {
      // Add files to pending media state for preview
      setPendingMediaFiles(prev => [...prev, ...validFiles]);
    }
  }, [toast]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [handleFileSelect]);

  // Modern file upload with progress and optimization
  const uploadFile = useCallback(async (file: File, caption: string = '', replyToId: string | null = null) => {
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const isVideo = file.type.startsWith('video/');
    const messageType = isVideo ? 'video' : 'image';
    const fileIcon = isVideo ? '🎥' : '📷';
    
    // Create optimistic message
    const optimisticMessage: Message = {
      id: tempId,
      user_id: user?.id!,
      content: caption || '',
      message_type: messageType,
      media_url: URL.createObjectURL(file), // Temporary URL for preview
      media_filename: file.name,
      media_size: file.size,
      likes_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reply_to_message_id: replyToId,
      delivery_status: 'sending',
      profiles: {
        full_name: userProfile?.full_name || 'You',
        profile_picture_url: userProfile?.profile_picture_url,
        character_id: userProfile?.character_id,
        classes: userProfile?.classes
      },
      message_likes: [],
      reply_message: null // Will be populated if needed
    };

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      // Try different bucket names with fallback
      const bucketOptions = isVideo 
        ? ['ukumbi-videos', 'videos', 'media', 'uploads'] 
        : ['ukumbi-images', 'images', 'media', 'uploads'];
      
      let uploadError: any = null;
      let bucketName = '';
      
      for (const bucket of bucketOptions) {
        try {
          console.log(`Trying to upload to bucket: ${bucket}`);
          const { error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });
          
          if (!error) {
            bucketName = bucket;
            uploadError = null;
            console.log(`Successfully uploaded to bucket: ${bucket}`);
            break;
          }
          console.log(`Failed to upload to ${bucket}:`, error);
          uploadError = error;
        } catch (error) {
          console.log(`Exception uploading to ${bucket}:`, error);
          uploadError = error;
          continue;
        }
      }

      if (uploadError) {
        console.error('All bucket upload attempts failed:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}. Please ensure storage buckets are properly configured.`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      // For videos, generate thumbnail (simplified approach)
      let thumbnailUrl = null;
      if (isVideo) {
        // TODO: Implement video thumbnail generation
        // For now, use a placeholder or the first frame
        thumbnailUrl = publicUrl; // Placeholder
      }

      // Save message to database (campus-based)
      const { data, error } = await supabase
        .from('messages')
        .insert({
          user_id: user?.id,
          university_id: userProfile?.university_id, // Add university_id for campus-based messaging
          content: optimisticMessage.content,
          message_type: messageType,
          media_url: publicUrl,
          media_filename: file.name,
          media_size: file.size,
          media_thumbnail: thumbnailUrl,
          reply_to_message_id: replyToId
        })
        .select()
        .single();

      if (error) throw error;

      // Update message with real data
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { 
              ...msg, 
              ...data, 
              media_url: publicUrl,
              media_thumbnail: thumbnailUrl,
              delivery_status: 'sent' 
            }
          : msg
      ));

      // Remove from uploading files
      setUploadingFiles(prev => prev.filter(f => f !== file));

          toast({
        title: "Success",
        description: `${isVideo ? 'Video' : 'Image'} uploaded successfully!`,
          });

    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Remove failed message
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setUploadingFiles(prev => prev.filter(f => f !== file));
      
      toast({
        title: "Upload failed",
        description: `Failed to upload ${file.name}. Please try again.`,
        variant: "destructive",
      });
    }
  }, [user, userProfile, toast]);

  const fetchUserProfile = async () => {
    try {
      // Skip the complex query for now and go directly to simple query
      // The new class system uses different table structure
        const { data: simpleData, error: simpleError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user?.id)
          .single();

        if (simpleError) throw simpleError;

        console.log('Simple profile data:', simpleData);
        console.log('User class_id:', simpleData.class_id);

      // If user has no class_id, show a message but allow access to general chat
        if (!simpleData.class_id) {
        console.log('User has no class_id, allowing general chat access');
        setUserProfile({
          ...simpleData,
          classes: null // No class data
        });
        setLoading(false);
          return;
        }

      // If user has class_id, fetch class data from the new classes table
        const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('name, description, creator_id')
          .eq('id', simpleData.class_id)
          .single();

        if (classError) {
        console.warn('Error fetching class data (non-critical):', classError);
        // Allow access even if class data fetch fails
        setUserProfile({
          ...simpleData,
          classes: null
        });
          } else {
        setUserProfile({
          ...simpleData,
          classes: classData
        });
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
      // Campus-based messaging: Only show messages from users in the same university
      if (!userProfile?.university_id) {
        console.log('User has no university, showing empty chat');
        setMessages([]);
        setLoading(false);
        return;
      }

      console.log('Fetching campus messages for university:', userProfile.university_id);

      // Fetch messages from users in the same university
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles!inner(
            full_name,
            profile_picture_url,
            character_id,
            university_id
          )
        `)
        .eq('profiles.university_id', userProfile.university_id)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.warn('Campus messages query failed, trying fallback:', error);
        
        // Fallback: Get all messages and filter by university
        const { data: allMessages, error: fallbackError } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(100);

        if (fallbackError) throw fallbackError;

        // Get profiles for message senders
        const userIds = [...new Set(allMessages?.map(msg => msg.user_id) || [])];
        const { data: profiles } = await supabase
              .from('profiles')
          .select('user_id, full_name, profile_picture_url, character_id, university_id')
          .in('user_id', userIds);

        // Filter messages to only include those from same university
        const campusMessages = allMessages?.filter(msg => {
          const profile = profiles?.find(p => p.user_id === msg.user_id);
          return profile?.university_id === userProfile.university_id;
        }).map(msg => {
          const profile = profiles?.find(p => p.user_id === msg.user_id);
            return {
            ...msg,
            profiles: profile || {
              full_name: 'Unknown User',
              profile_picture_url: null,
              character_id: null
            },
            message_likes: []
          };
        }) || [];

        setMessages(campusMessages);
      } else {
        // Add empty message_likes array for each message
        const messagesWithLikes = data?.map(msg => ({
          ...msg,
          message_likes: []
        })) || [];
        
        // Fetch reply message data for messages that have replies
        const messagesWithReplies = messagesWithLikes.filter(msg => msg.reply_to_message_id);
        if (messagesWithReplies.length > 0) {
          const replyIds = messagesWithReplies.map(msg => msg.reply_to_message_id);
          
          try {
            // Fetch the original messages being replied to
            const { data: replyMessages } = await supabase
              .from('messages')
              .select(`
                id,
                content,
                message_type,
                media_filename,
                created_at,
                profiles!user_id(
                full_name,
                  profile_picture_url
                )
              `)
              .in('id', replyIds);
            
            // Map reply messages to the main messages
            const messagesWithReplyData = messagesWithLikes.map(message => {
              if (message.reply_to_message_id) {
                const replyMessage = replyMessages?.find(reply => reply.id === message.reply_to_message_id);
            return {
              ...message,
                  reply_message: replyMessage || null
                };
              }
              return message;
            });
            
            setMessages(messagesWithReplyData);
          } catch (replyError) {
            console.error('Error fetching reply messages:', replyError);
            setMessages(messagesWithLikes);
          }
      } else {
          setMessages(messagesWithLikes);
      }
      }

      console.log(`Loaded ${data?.length || 0} campus messages`);
    } catch (error) {
      console.error('Error fetching campus messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!userProfile?.university_id) {
      console.log('No university ID, skipping real-time subscription');
      return () => {};
    }

    console.log('Setting up campus real-time subscription for university:', userProfile.university_id);

    const channel = supabase
      .channel(`campus-messages-${userProfile.university_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          console.log('New message received via real-time:', payload.new);
          
          // Only show if it's from current user (optimistic update) or from same campus
          if (payload.new.user_id === user?.id) {
            return; // Skip - we already have optimistic update
          }

          // Fetch sender profile to check if they're from same university
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('full_name, profile_picture_url, character_id, university_id')
            .eq('user_id', payload.new.user_id)
            .single();

          if (senderProfile?.university_id === userProfile.university_id) {
            const newMessage = {
              ...payload.new,
              profiles: senderProfile,
              message_likes: []
            };
            
            setMessages(prev => [...prev, newMessage]);
            
            // Scroll to bottom
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }
        }
      )
      .subscribe((status) => {
        console.log('Campus subscription status:', status);
      });

    return () => {
      console.log('Cleaning up campus real-time subscription');
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
    if ((!newMessage.trim() && pendingMediaFiles.length === 0) || sending) return;

    // If user has no university, show message to complete profile
    if (!userProfile?.university_id) {
      toast({
        title: "Complete Your Profile",
        description: "Please complete your profile with university information to participate in campus chat.",
        action: (
          <button 
            onClick={() => window.location.href = '/profile'}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
          >
            Complete Profile
          </button>
        ),
      });
      return;
    }

    const messageContent = newMessage.trim();
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const replyToId = replyingTo?.id || null; // Store reply ID before clearing
    
    // Handle media files if present
    if (pendingMediaFiles.length > 0) {
      setSending(true);
      try {
        // Send media files with caption
        console.log('Sending', pendingMediaFiles.length, 'media files with caption:', messageContent);
        for (const file of pendingMediaFiles) {
          console.log('Uploading file:', file.name);
          await uploadFile(file, messageContent, replyToId);
          console.log('File uploaded successfully:', file.name);
        }
        setPendingMediaFiles([]);
        setNewMessage("");
        setReplyingTo(null);
      } catch (error) {
        console.error('Error sending media files:', error);
        toast({
          title: "Upload failed",
          description: "Failed to send media files. Please try again.",
          variant: "destructive",
        });
      } finally {
        setSending(false);
      }
      return;
    }
    
    // Create optimistic text message
    const optimisticMessage: Message = {
      id: tempId,
      user_id: user?.id!,
      content: messageContent,
      message_type: 'text',
      media_url: null,
      media_filename: null,
      media_size: null,
      likes_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reply_to_message_id: replyToId,
      delivery_status: 'sending',
      profiles: {
        full_name: userProfile.full_name,
        profile_picture_url: userProfile.profile_picture_url,
        character_id: userProfile.character_id
      },
      message_likes: [],
      reply_message: replyingTo ? {
        id: replyingTo.id,
        content: replyingTo.content,
        message_type: replyingTo.message_type,
        media_filename: replyingTo.media_filename,
        created_at: replyingTo.created_at,
        profiles: {
          full_name: replyingTo.profiles.full_name,
          profile_picture_url: replyingTo.profiles.profile_picture_url
        }
      } : null
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
      // Insert message to database (campus-based)
      const { data, error } = await supabase
        .from('messages')
        .insert({
          user_id: user?.id,
          university_id: userProfile?.university_id || null, // Add university_id for campus-based messaging
          content: messageContent,
          message_type: 'text',
          reply_to_message_id: replyToId
        })
        .select()
        .single();

      if (error) throw error;

      // Update optimistic message with real message data
        setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { 
              ...msg, 
              ...data, 
              delivery_status: 'sent',
              profiles: msg.profiles, // Keep the profile data from optimistic message
              reply_message: msg.reply_message // Keep the reply data from optimistic message
            }
          : msg
      ));
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



  // Helper function to check if user has liked a message
  const hasUserLiked = (message: Message) => {
    return message.message_likes.some(like => like.user_id === user?.id);
  };

  const toggleLike = async (messageId: string) => {
    if (!user) return;

    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const isLiked = hasUserLiked(message);

      // Optimistic update - update UI immediately
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          if (isLiked) {
            // Remove like optimistically
            return {
              ...msg,
              likes_count: Math.max(0, msg.likes_count - 1),
              message_likes: msg.message_likes.filter(like => like.user_id !== user.id)
            };
          } else {
            // Add like optimistically
            return {
              ...msg,
              likes_count: msg.likes_count + 1,
              message_likes: [...msg.message_likes, { user_id: user.id }]
            };
          }
        }
        return msg;
      }));

      if (isLiked) {
        // Unlike - remove from database
        const { error } = await supabase
          .from('message_likes')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', user.id);

        if (error) {
          // Revert optimistic update on error
          setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
              return {
                ...msg,
                likes_count: msg.likes_count + 1,
                message_likes: [...msg.message_likes, { user_id: user.id }]
              };
            }
            return msg;
          }));
          throw error;
        }
      } else {
        // Like - add to database
        const { error } = await supabase
          .from('message_likes')
          .insert({
            message_id: messageId,
            user_id: user.id
          });

        if (error) {
          // Revert optimistic update on error
          setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
              return {
                ...msg,
                likes_count: Math.max(0, msg.likes_count - 1),
                message_likes: msg.message_likes.filter(like => like.user_id !== user.id)
              };
            }
            return msg;
          }));
          
          // If it's a duplicate key error, it means the like already exists
          // This can happen with rapid clicking or race conditions
          if (error.code === '23505') {
            console.log('Like already exists, ignoring duplicate error');
            return; // Don't show error for duplicate likes
          }
          
          throw error;
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
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

  // Jump to original message when clicking on reply
  const jumpToMessage = (messageId: string) => {
    if (!messageId) {
      console.warn('Cannot jump to message: messageId is undefined');
      return;
    }
    
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      // Highlight the message
      setHighlightedMessageId(messageId);
      
      // Scroll to the message
      messageElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Remove highlight after 3 seconds
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 3000);
    } else {
      console.warn(`Message element not found: message-${messageId}`);
      toast({
        title: "Message not found",
        description: "The original message may have been deleted or is not visible.",
        variant: "destructive",
      });
    }
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
        <div className="messages-container flex-1 overflow-y-auto p-1 sm:p-2 space-y-1">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  {!userProfile?.university_id ? (
                    <div className="space-y-4">
                      <p>Welcome to Campus Chat!</p>
                      <p className="text-sm">Complete your profile with university information to join your campus community.</p>
                      <Button 
                        onClick={() => window.location.href = '/profile'}
                        className="mt-4"
                      >
                        Complete Profile
                      </Button>
                </div>
              ) : (
                    <div className="space-y-2">
                      <p>Welcome to your campus chat!</p>
                      <p className="text-sm">Connect with students from your university. Be the first to say something!</p>
                    </div>
                  )}
                </div>
              ) : (
                messages.map((message, index) => {
                  const isOwn = message.user_id === user?.id;
                  const isPending = message.delivery_status === 'sending' || pendingMessages.has(message.id);
                  const showAvatar = index === 0 || messages[index - 1]?.user_id !== message.user_id;
                  const isLastInGroup = index === messages.length - 1 || messages[index + 1]?.user_id !== message.user_id;
                  const showTimestamp = showAvatar || (new Date(message.created_at).getTime() - new Date(messages[index - 1]?.created_at || 0).getTime()) > 300000; // 5 minutes
                  
                  return (
                  <div
                    key={message.id}
                    id={`message-${message.id}`}
                      className={`group relative transition-all duration-200 hover:bg-gray-50/30 rounded-xl p-2 -m-2 ${
                        isPending ? 'opacity-70' : 'opacity-100'
                      } ${
                        highlightedMessageId === message.id 
                          ? 'bg-yellow-100 border-2 border-yellow-300 shadow-lg' 
                          : ''
                    }`}
                  >
                      <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar Column */}
                        {!isOwn && (
                          <div className="flex-shrink-0 w-10">
                            {showAvatar ? (
                    <ProfilePictureModal
                      src={message.profiles.profile_picture_url}
                      fallback={message.profiles.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      alt={message.profiles.full_name}
                              className="h-10 w-10 ring-2 ring-white shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-105"
                      name={message.profiles.full_name}
                              course={message.profiles.course_name}
                            />
                          ) : (
                            <div className="h-10 w-10 flex items-center justify-center">
                              {showTimestamp && (
                                <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  {format(new Date(message.created_at), 'HH:mm')}
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
                                {message.profiles.full_name}
                              </button>
                              <span className="text-xs text-gray-500 font-medium">
                                {formatMessageTime(message.created_at)}
                              </span>
                              {message.profiles.course_name && (
                                <Badge variant="secondary" className="text-xs px-2 py-0.5 h-5 bg-blue-50 text-blue-700 border-blue-200">
                                  {message.profiles.course_name}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Advanced Reply Context */}
                        {message.reply_to_message_id && (
                          message.reply_message ? (
                            <div 
                              className="mb-1 pl-2 border-l-2 border-blue-400 bg-blue-50/70 rounded-r-xl p-1.5 cursor-pointer hover:bg-blue-100/70 transition-colors duration-200"
                              onClick={() => message.reply_message?.id && jumpToMessage(message.reply_message.id)}
                            >
                              <div className="flex items-start gap-2">
                                <Reply className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-semibold text-blue-700">
                                      {message.reply_message.profiles?.full_name || 'Unknown User'}
                                    </span>
                                    <span className="text-xs text-blue-500">
                                      {formatMessageTime(message.reply_message.created_at)}
                                    </span>
                          </div>
                                  <div className="text-xs text-gray-700">
                                    {message.reply_message.message_type === 'text' ? (
                                      <p className="truncate">
                                        {message.reply_message.content.length > 50 
                                          ? `${message.reply_message.content.substring(0, 50)}...` 
                                          : message.reply_message.content
                                        }
                                      </p>
                                    ) : message.reply_message.message_type === 'image' ? (
                                      <div className="flex items-center gap-1 text-gray-600">
                                        <ImageIcon className="h-3 w-3" />
                                        <span className="italic">Photo</span>
                                        {message.reply_message.content && (
                                          <span className="truncate">
                                            {message.reply_message.content.length > 30 
                                              ? `- ${message.reply_message.content.substring(0, 30)}...` 
                                              : `- ${message.reply_message.content}`
                                            }
                                          </span>
                                        )}
                                      </div>
                                    ) : message.reply_message.message_type === 'video' ? (
                                      <div className="flex items-center gap-1 text-gray-600">
                                        <Video className="h-3 w-3" />
                                        <span className="italic">Video</span>
                                        {message.reply_message.content && (
                                          <span className="truncate">
                                            {message.reply_message.content.length > 30 
                                              ? `- ${message.reply_message.content.substring(0, 30)}...` 
                                              : `- ${message.reply_message.content}`
                                            }
                                          </span>
                                        )}
                                      </div>
                                    ) : message.reply_message.message_type === 'file' ? (
                                      <div className="flex items-center gap-1 text-gray-600">
                                        <FileIcon className="h-3 w-3" />
                                        <span className="italic">File</span>
                                        {message.reply_message.media_filename && (
                                          <span className="truncate">
                                            {message.reply_message.media_filename.length > 30 
                                              ? `- ${message.reply_message.media_filename.substring(0, 30)}...` 
                                              : `- ${message.reply_message.media_filename}`
                                            }
                                          </span>
                            )}
                          </div>
                        ) : (
                                      <p className="truncate italic text-gray-500">Message</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                          </div>
                          ) : (
                            // Show when original message was deleted
                            <div className="mb-1 pl-2 border-l-2 border-gray-300 bg-gray-50/70 rounded-r-xl p-1.5">
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Reply className="h-3 w-3" />
                                <span className="italic">This message was deleted</span>
                              </div>
                            </div>
                          )
                        )}

                          {/* Media Content */}
                          {(message.message_type === 'image' || message.message_type === 'video') && message.media_url && (
                            <div className="mb-1">
                              <MediaPlayer 
                                message={message} 
                                currentlyPlayingVideo={currentlyPlayingVideo}
                                setCurrentlyPlayingVideo={setCurrentlyPlayingVideo}
                              />
                          </div>
                          )}

                          {/* Text Content */}
                          {message.content && (
                            <div className={`text-sm leading-snug break-words p-2 rounded-2xl max-w-xs ${
                              isOwn 
                                ? 'bg-blue-500 text-white ml-auto rounded-br-lg' 
                                : 'bg-gray-100 text-gray-900 mr-auto rounded-bl-lg'
                            }`}>
                              <span className="whitespace-pre-wrap">{message.content}</span>
                              {isPending && (
                                <span className="ml-2 inline-flex items-center">
                                  <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                                </span>
                              )}
                          </div>
                        )}

                          {/* Reactions */}
                          <div className="flex items-center gap-1 mt-0.5">
                            <button 
                              onClick={() => toggleLike(message.id)}
                              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                                hasUserLiked(message)
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-red-50 text-red-600 hover:bg-red-100'
                              }`}
                              title={hasUserLiked(message) ? 'Unlike this message' : 'Like this message'}
                            >
                              <Heart className={`h-3 w-3 ${
                                hasUserLiked(message) ? 'fill-current' : ''
                              }`} />
                              {message.likes_count > 0 && message.likes_count}
                            </button>
                          </div>

                          {/* Delivery Status for own messages */}
                          {isOwn && !isPending && (
                            <div className="flex items-center justify-end mt-1">
                              <div className="flex items-center text-xs text-gray-400">
                                {message.delivery_status === 'read' ? (
                                  <CheckCheck className="h-3 w-3 text-blue-500" />
                                ) : message.delivery_status === 'delivered' ? (
                                  <CheckCheck className="h-3 w-3" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                              </div>
                          </div>
                        )}
                      </div>

                        {/* Message Actions - appear on hover */}
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
                          <div className="flex items-center gap-1 bg-white shadow-lg rounded-full p-1 border border-gray-200">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                              onClick={() => setReplyingTo(message)}
                            >
                              <Reply className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className={`h-7 w-7 p-0 transition-colors duration-200 ${
                                hasUserLiked(message)
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700'
                                  : 'text-gray-500 hover:bg-red-50 hover:text-red-600'
                              }`}
                              onClick={() => toggleLike(message.id)}
                              title={hasUserLiked(message) ? 'Unlike this message' : 'Like this message'}
                            >
                              <Heart className={`h-3 w-3 ${
                                hasUserLiked(message)
                                  ? 'fill-red-500 text-red-500'
                                  : 'text-gray-500'
                              }`} />
                            </Button>
                            {isOwn && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                                onClick={() => setShowDeleteDialog(message)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                    </div>
                  </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

        {/* Enhanced Reply Preview */}
        {replyingTo && (
          <div className="flex-shrink-0 border-t bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 p-3 rounded-t-2xl">
            <div className="flex items-start gap-3">
              {/* Reply indicator line */}
              <div className="w-1 bg-blue-500 rounded-full flex-shrink-0 mt-1 mb-1 self-stretch"></div>
              
              <div className="flex-1 min-w-0">
                {/* Sender name */}
                <div className="flex items-center gap-2 mb-1">
                  <Reply className="h-3 w-3 text-blue-600" />
                  <p className="text-xs font-semibold text-blue-700">
                    Replying to {replyingTo.profiles.full_name}
                  </p>
              </div>
                
                {/* Message content with smart truncation */}
                <div className="text-sm text-gray-700">
                  {replyingTo.message_type === 'text' ? (
                    <p className="truncate max-w-full">
                      {replyingTo.content.length > 60 
                        ? `${replyingTo.content.substring(0, 60)}...` 
                        : replyingTo.content
                      }
                    </p>
                  ) : replyingTo.message_type === 'image' ? (
                    <div className="flex items-center gap-2 text-gray-600">
                      <ImageIcon className="h-3 w-3" />
                      <span className="italic">Photo</span>
                      {replyingTo.content && (
                        <span className="truncate">
                          {replyingTo.content.length > 40 
                            ? `- ${replyingTo.content.substring(0, 40)}...` 
                            : `- ${replyingTo.content}`
                          }
                        </span>
                      )}
                    </div>
                  ) : replyingTo.message_type === 'video' ? (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Video className="h-3 w-3" />
                      <span className="italic">Video</span>
                      {replyingTo.content && (
                        <span className="truncate">
                          {replyingTo.content.length > 40 
                            ? `- ${replyingTo.content.substring(0, 40)}...` 
                            : `- ${replyingTo.content}`
                          }
                        </span>
                      )}
                    </div>
                  ) : replyingTo.message_type === 'file' ? (
                    <div className="flex items-center gap-2 text-gray-600">
                      <FileIcon className="h-3 w-3" />
                      <span className="italic">File</span>
                      {replyingTo.media_filename && (
                        <span className="truncate">
                          {replyingTo.media_filename.length > 40 
                            ? `- ${replyingTo.media_filename.substring(0, 40)}...` 
                            : `- ${replyingTo.media_filename}`
                          }
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="truncate italic text-gray-500">Message</p>
                  )}
                </div>
              </div>
              
              {/* Close button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={cancelReply}
                className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600 transition-colors duration-200 flex-shrink-0"
                title="Cancel reply"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Ultra-Modern Message Input */}
        <div 
          className={`flex-shrink-0 border-t bg-white/80 backdrop-blur-sm p-3 transition-all duration-300 ${
            dragActive ? 'bg-blue-50 border-blue-300' : ''
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Drag & Drop Overlay */}
          {dragActive && (
            <div className="absolute inset-0 bg-blue-50/90 backdrop-blur-sm border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center z-10">
              <div className="text-center">
                <Plus className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-blue-700 font-medium">Drop images or videos here</p>
                <p className="text-blue-600 text-sm">Up to 10MB for images, 100MB for videos</p>
              </div>
            </div>
          )}

          {/* Pending Media Preview */}
          {pendingMediaFiles.length > 0 && (
            <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
              {pendingMediaFiles.map((file, index) => (
                <div key={index} className="flex-shrink-0 bg-blue-50 border border-blue-200 rounded-xl p-2 min-w-[120px] relative">
                  <div className="flex flex-col gap-2">
                    {file.type.startsWith('video/') ? (
                      <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Video className="h-6 w-6 text-purple-600" />
                      </div>
                    ) : (
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt="Preview" 
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-blue-700">Ready to send</p>
                      <p className="text-xs text-gray-500 truncate">{(file.size / 1024 / 1024).toFixed(1)}MB</p>
        </div>
      </div>
                  <button
                    onClick={() => setPendingMediaFiles(prev => prev.filter((_, i) => i !== index))}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Uploading Files Preview */}
          {uploadingFiles.length > 0 && (
            <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
              {uploadingFiles.map((file, index) => (
                <div key={index} className="flex-shrink-0 bg-gray-100 rounded-lg p-2 min-w-[120px]">
              <div className="flex items-center gap-2">
                    {file.type.startsWith('video/') ? (
                      <Video className="h-4 w-4 text-purple-600" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-green-600" />
                    )}
                <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                        <span className="text-xs text-gray-500">Uploading...</span>
                </div>
              </div>
            </div>
                </div>
              ))}
            </div>
          )}

          {/* Typing Indicators */}
          {typingUsers.length > 0 && (
            <div className="mb-3 flex items-center gap-2 text-sm text-gray-500">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]"></div>
            </div>
              <span>
                {typingUsers.length === 1 
                  ? `${typingUsers[0]} is typing...`
                  : `${typingUsers.length} people are typing...`
                }
              </span>
            </div>
          )}

          <form onSubmit={sendMessage} className="flex items-end gap-3">
            {/* Media Upload Button */}
            <div className="flex-shrink-0">
              <Button
              type="button"
                variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="h-10 w-10 p-0 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
            >
              {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              ) : (
                  <Plus className="h-5 w-5" />
              )}
              </Button>
            </div>

            {/* Message Input Container */}
            <div className="flex-1 relative">
              <div className="relative bg-gray-100 rounded-2xl border border-gray-200 focus-within:border-blue-300 focus-within:bg-white transition-all duration-200">
            <Input
              value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
              placeholder={pendingMediaFiles.length > 0 ? "Add a caption..." : "Type a message..."}
                  className="border-0 bg-transparent rounded-2xl px-4 py-3 pr-12 text-sm resize-none focus:ring-0 focus:outline-none"
              disabled={sending || !userProfile}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e as any);
                    }
                  }}
                />
                
                {/* Emoji Button */}
              <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full hover:bg-gray-200 transition-colors duration-200"
                >
                  <Smile className="h-4 w-4 text-gray-500" />
                </Button>
                  </div>
            </div>

            {/* Send Button */}
            <div className="flex-shrink-0">
              <Button 
                type="submit" 
                size="sm" 
                disabled={sending || !newMessage.trim() || !userProfile}
                className={`h-10 w-10 p-0 rounded-full transition-all duration-200 ${
                  newMessage.trim() 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
              {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                  <Send className="h-4 w-4 ml-0.5" />
                )}
              </Button>
            </div>
          </form>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            title="Upload images or videos"
            aria-label="Upload images or videos"
          />
          </div>
        </div>


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
