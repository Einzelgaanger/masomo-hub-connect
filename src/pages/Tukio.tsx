import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Share, Volume2, VolumeX, Play, Pause, ChevronLeft, X, Send, Trash2, MoreVertical, Video, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    profile_picture_url: string;
  };
}

interface Reel {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  duration: number;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    profile_picture_url: string;
    bio: string;
    follower_count: number;
    following_count: number;
    video_count: number;
  };
  video_likes: Array<{ user_id: string }>;
  video_comments: Comment[];
}

const Tukio = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false); // Start with sound enabled
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [animatingLikes, setAnimatingLikes] = useState<Set<string>>(new Set());
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [loadedVideos, setLoadedVideos] = useState<Set<string>>(new Set());
  const [bufferedVideos, setBufferedVideos] = useState<Set<string>>(new Set());
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const preloadQueue = useRef<string[]>([]);
  const activeVideos = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (user) {
      fetchReels();
    }
  }, [user]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  // Optimized video management for smooth playback
  useEffect(() => {
    if (reels.length === 0) return;

    // Pause all videos except current
    videoRefs.current.forEach((video, index) => {
      if (video && index !== currentIndex) {
        video.pause();
        video.muted = true;
        video.currentTime = 0; // Reset to start for better performance
      }
    });

    // Play current video with optimization
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      // Set audio settings
      currentVideo.muted = isMuted;
      currentVideo.volume = isMuted ? 0 : 1;
      
      // Ensure video is loaded before playing
      if (currentVideo.readyState >= 3) { // HAVE_FUTURE_DATA
        currentVideo.play().catch((error) => {
          if (error.name !== 'AbortError') {
            console.error('Video play error:', error);
          }
        });
      } else {
        // Wait for video to be ready
        const handleCanPlay = () => {
          currentVideo.play().catch((error) => {
            if (error.name !== 'AbortError') {
              console.error('Video play error:', error);
            }
          });
          currentVideo.removeEventListener('canplay', handleCanPlay);
        };
        currentVideo.addEventListener('canplay', handleCanPlay);
      }
      
      setIsPlaying(true);
    }

  }, [currentIndex, isMuted]);

  // TikTok-style video preloading function (Fixed for Supabase Storage)
  const preloadVideo = (videoId: string, videoUrl: string, index: number) => {
    // Skip all preloading for now to avoid issues
    console.log(`Skipping preload for video: ${videoId}`);
    return;
  };

  // Handle wheel events and touch for horizontal scrolling
  useEffect(() => {
    let touchStartY = 0;
    let touchEndY = 0;

    const handleWheel = (e: WheelEvent) => {
      // Prevent default scroll behavior
      e.preventDefault();
      
      // If already scrolling, ignore
      if (isScrolling.current) return;
      
      isScrolling.current = true;
      
      // Scroll right to left (negative deltaY means scroll up/left)
      if (e.deltaY < 0 && currentIndex > 0) {
        // Scroll left (previous video)
        setCurrentIndex(prev => prev - 1);
      } else if (e.deltaY > 0 && currentIndex < reels.length - 1) {
        // Scroll right (next video)
        setCurrentIndex(prev => prev + 1);
      }
      
      // Reset scrolling flag after a short delay
      setTimeout(() => {
        isScrolling.current = false;
      }, 100);
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndY = e.changedTouches[0].clientY;
      handleSwipe();
    };

    const handleSwipe = () => {
      const swipeThreshold = 50;
      const diff = touchStartY - touchEndY;

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0 && currentIndex > 0) {
          // Swipe up (previous video)
          goToPreviousVideo();
        } else if (diff < 0 && currentIndex < reels.length - 1) {
          // Swipe down (next video)
          goToNextVideo();
        }
      }
    };

    // Add event listeners
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentIndex, reels.length]);

  const fetchReels = async () => {
    setLoading(true);
    try {
      // Fetch videos first
      const { data: videos, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (videosError) {
        // If videos table doesn't exist yet, show empty state
        if (videosError.code === 'PGRST200' || videosError.message.includes('relation "videos" does not exist')) {
          console.log('Videos table not created yet - showing empty state');
          setReels([]);
          setLoading(false);
          return;
        } else {
          throw videosError;
        }
      }

      if (!videos || videos.length === 0) {
        setReels([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for each video
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, profile_picture_url, bio, follower_count, following_count, video_count')
        .in('user_id', videos.map(v => v.user_id));

      // Fetch likes for each video
      const { data: likes } = await supabase
        .from('video_likes')
        .select('video_id, user_id')
        .in('video_id', videos.map(v => v.id));

      // Fetch comments for each video
      const { data: comments } = await supabase
        .from('video_comments')
        .select('id, video_id, content, created_at, user_id')
        .in('video_id', videos.map(v => v.id));

      // Fetch comment profiles
      const commentUserIds = [...new Set(comments?.map(c => c.user_id) || [])];
      const { data: commentProfiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, profile_picture_url')
        .in('user_id', commentUserIds);

      // Combine data
      const reelsWithData = videos.map(video => {
        const profile = profiles?.find(p => p.user_id === video.user_id);
        const videoLikes = likes?.filter(l => l.video_id === video.id) || [];
        const videoComments = comments?.filter(c => c.video_id === video.id).map(comment => ({
          ...comment,
          profiles: commentProfiles?.find(p => p.user_id === comment.user_id)
        })) || [];

        return {
          ...video,
          profiles: profile,
          video_likes: videoLikes,
          video_comments: videoComments
        };
      });

      setReels(reelsWithData);
      
      // Initialize liked videos set
      if (user) {
        const userLikedVideos = new Set(
          likes?.filter(like => like.user_id === user.id).map(like => like.video_id) || []
        );
        setLikedVideos(userLikedVideos);
      }
    } catch (error) {
      console.error('Error fetching reels:', error);
      // Set empty reels array to prevent crashes
      setReels([]);
      toast({
        title: "Error",
        description: "Failed to load reels. Database tables may not be set up yet.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const goToNextVideo = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const goToPreviousVideo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Remove inline handleScroll - we handle this in useEffect with proper event listeners

  const handleTouchStart = (e: React.TouchEvent) => {
    const startY = e.touches[0].clientY;
    
    const handleTouchEnd = (e: React.TouchEvent) => {
      const endY = e.changedTouches[0].clientY;
      const deltaY = startY - endY;
      
      if (Math.abs(deltaY) > 50) {
        if (deltaY > 0 && currentIndex < reels.length - 1) {
          // Swipe up - next reel
          goToNextVideo();
        } else if (deltaY < 0 && currentIndex > 0) {
          // Swipe down - previous reel
          goToPreviousVideo();
        }
      }
      
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchend', handleTouchEnd);
  };

  const togglePlayPause = () => {
    const video = videoRefs.current[currentIndex];
    if (video) {
      if (isPlaying) {
        video.pause();
        setIsPlaying(false);
      } else {
        video.play().catch((error) => {
          // Ignore play interruption errors
          if (error.name !== 'AbortError') {
            console.error('Video play error:', error);
          }
        });
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    // Update ALL videos to ensure no audio overlap
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentIndex) {
          // Current video gets the new mute state
          video.muted = newMutedState;
          video.volume = newMutedState ? 0 : 1;
        } else {
          // All other videos stay muted
          video.muted = true;
          video.volume = 0;
        }
      }
    });
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePlayPause();
  };

  const handleLike = async (videoId: string) => {
    if (!user) return;

    // Add animation immediately for instant feedback
    setAnimatingLikes(prev => new Set(prev).add(videoId));
    
    // Remove animation after 1 second
    setTimeout(() => {
      setAnimatingLikes(prev => {
        const newSet = new Set(prev);
        newSet.delete(videoId);
        return newSet;
      });
    }, 1000);

    try {
      const isLiked = likedVideos.has(videoId);
      
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', user.id);

        if (error) throw error;
        
        setLikedVideos(prev => {
          const newSet = new Set(prev);
          newSet.delete(videoId);
          return newSet;
        });
        
        // Update local reels data
        setReels(prev => prev.map(reel => 
          reel.id === videoId 
            ? { ...reel, video_likes: reel.video_likes.filter(like => like.user_id !== user.id) }
            : reel
        ));
      } else {
        // Like
        const { error } = await supabase
          .from('video_likes')
          .insert({ video_id: videoId, user_id: user.id });

        if (error) throw error;
        
        setLikedVideos(prev => new Set(prev).add(videoId));
        
        // Update local reels data
        setReels(prev => prev.map(reel => 
          reel.id === videoId 
            ? { ...reel, video_likes: [...reel.video_likes, { user_id: user.id }] }
            : reel
        ));
      }
    } catch (error) {
      console.error('Error updating like:', error);
      // Remove animation if there's an error
      setAnimatingLikes(prev => {
        const newSet = new Set(prev);
        newSet.delete(videoId);
        return newSet;
      });
    }
  };

  const handleComment = async () => {
    if (!user || !newComment.trim() || !reels[currentIndex]) return;

    setIsSubmittingComment(true);
    try {
      const { error } = await supabase
        .from('video_comments')
        .insert({
          video_id: reels[currentIndex].id,
          user_id: user.id,
          content: newComment.trim()
        });

      if (error) throw error;

      // Refresh comments
      await fetchReels();
      setNewComment("");
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('video_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh comments
      await fetchReels();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleCommentLongPress = (commentId: string) => {
    if (!user) return;

    // Clear any existing timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
    }

    // Set new timer for long press
    const timer = setTimeout(() => {
      // Check if user can delete this comment
      const currentReel = reels[currentIndex];
      const comment = currentReel?.video_comments.find(c => c.id === commentId);
      
      if (comment && (user.id === comment.user_id || user.id === currentReel?.user_id)) {
        handleDeleteComment(commentId);
        toast({
          title: "Comment deleted",
          description: "The comment has been deleted.",
        });
      }
    }, 1000); // 1 second long press

    setLongPressTimer(timer);
  };

  const handleCommentPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh reels
      await fetchReels();
      
      // Adjust current index if needed
      if (currentIndex >= reels.length - 1 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error",
        description: "Failed to delete video.",
        variant: "destructive",
      });
    }
  };

  const toggleDescription = (videoId: string) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: reels[currentIndex]?.title,
        text: reels[currentIndex]?.content,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <Video className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-4 fredoka-bold">No reels available</h2>
          <p className="text-gray-300 mb-2">No videos have been uploaded yet.</p>
          <p className="text-gray-400 mb-6 text-sm">Upload your first video to get started!</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/profile/' + user?.id)} variant="outline" className="text-white border-white">
              Go to Profile
            </Button>
            <Button onClick={() => navigate('/dashboard')} variant="outline" className="text-white border-white">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentReel = reels[currentIndex];

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-black overflow-hidden relative"
      onTouchStart={handleTouchStart}
    >
      {/* Back Button */}
      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-50">
        <Button
          onClick={() => navigate('/dashboard')}
          variant="ghost"
          size="sm"
          className="bg-black/50 text-white hover:bg-black/70 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
        >
          <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Back</span>
          <span className="sm:hidden">←</span>
        </Button>
      </div>

      {/* Progress Indicator */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50">
        <div className="bg-black/50 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm">
          <span className="hidden sm:inline">{currentIndex + 1} / {reels.length}</span>
          <span className="sm:hidden">{currentIndex + 1}/{reels.length}</span>
        </div>
      </div>


      {/* Navigation Buttons - Always Visible */}
      <div className="block">
        {/* Previous Video Button */}
        {currentIndex > 0 && (
          <div className="absolute left-1/2 top-8 transform -translate-x-1/2 z-50">
            <Button
              onClick={goToPreviousVideo}
              variant="ghost"
              size="lg"
              className="w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70 border border-white/20"
            >
              <ChevronUp className="h-6 w-6" />
            </Button>
          </div>
        )}

        {/* Next Video Button */}
        {currentIndex < reels.length - 1 && (
          <div className="absolute left-1/2 bottom-8 transform -translate-x-1/2 z-50">
            <Button
              onClick={goToNextVideo}
              variant="ghost"
              size="lg"
              className="w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70 border border-white/20"
            >
              <ChevronDown className="h-6 w-6" />
            </Button>
          </div>
        )}
      </div>

      {/* Reel Container */}
      <div 
        className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateY(-${currentIndex * 100}vh)` }}
      >
        {reels.map((reel, index) => (
          <div
            key={reel.id}
            className="w-full h-screen flex-shrink-0 relative"
          >
            {/* Video */}
            {reel.video_url && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                {/* Simple loading indicator only for current video */}
                {index === currentIndex && !loadedVideos.has(reel.id) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                      <p className="text-white text-sm">Loading...</p>
                    </div>
                  </div>
                )}
                <video
                  ref={el => videoRefs.current[index] = el}
                  src={reel.video_url}
                  className="max-w-full max-h-full object-contain"
                  onClick={handleVideoClick}
                  muted={index !== currentIndex || isMuted}
                  loop
                  playsInline
                  autoPlay={index === currentIndex} // Auto-play current video
                  preload={index === currentIndex ? "auto" : "metadata"} // More aggressive preloading for current video
                  crossOrigin="anonymous"
                  onPlay={() => {
                    if (index === currentIndex) {
                      setIsPlaying(true);
                    }
                  }}
                  onPause={() => {
                    if (index === currentIndex) {
                      setIsPlaying(false);
                    }
                  }}
                  onLoadedData={() => {
                    setLoadedVideos(prev => new Set([...prev, reel.id]));
                    setBufferedVideos(prev => new Set([...prev, reel.id]));
                  }}
                  onCanPlay={() => {
                    // Video is ready to play
                    if (index === currentIndex && !isPlaying) {
                      const video = videoRefs.current[index];
                      if (video && video.paused) {
                        video.play().catch((error) => {
                          if (error.name !== 'AbortError') {
                            console.error('Video play error:', error);
                          }
                        });
                      }
                    }
                  }}
                  onWaiting={() => {
                    // Video is buffering - show loading indicator
                    if (index === currentIndex) {
                      setBufferedVideos(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(reel.id);
                        return newSet;
                      });
                    }
                  }}
                  onCanPlayThrough={() => {
                    // Video can play through without buffering
                    if (index === currentIndex) {
                      setBufferedVideos(prev => new Set([...prev, reel.id]));
                    }
                  }}
                  onError={(e) => {
                    console.error('Video loading error:', e);
                    // Retry loading with exponential backoff
                    setTimeout(() => {
                      const video = e.target as HTMLVideoElement;
                      if (video && video.error) {
                        video.load();
                      }
                    }, 2000);
                  }}
                  poster={reel.thumbnail_url}
                />
              </div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 text-white">
              {/* Profile Info */}
              <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                <div 
                  className="w-8 h-8 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-white cursor-pointer hover:scale-105 transition-transform flex-shrink-0"
                  onClick={() => navigate(`/profile/${reel.user_id}`)}
                >
                  <img
                    src={reel.profiles?.profile_picture_url || '/default-avatar.png'}
                    alt={reel.profiles?.full_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div 
                    className="flex items-center gap-1 sm:gap-2 cursor-pointer"
                    onClick={() => navigate(`/profile/${reel.user_id}`)}
                  >
                    <h4 className="font-bold text-sm sm:text-lg fredoka-bold hover:underline truncate">
                      {reel.profiles?.full_name}
                    </h4>
                    <span className="text-xs text-gray-300 flex-shrink-0">
                      {format(new Date(reel.created_at), 'MMM dd')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 truncate">
                    {reel.profiles?.follower_count} followers
                  </p>
                </div>
              </div>

              {/* Title and Description */}
              <h3 className="text-base sm:text-xl font-bold mb-1 sm:mb-2 fredoka-bold line-clamp-2">
                {reel.title}
              </h3>
              <div className="text-xs sm:text-sm text-gray-200 mb-2 sm:mb-4 fredoka-medium">
                {reel.description && (
                  <div>
                    {expandedDescriptions.has(reel.id) || reel.description.length <= (window.innerWidth < 640 ? 80 : 100) ? (
                      <p className="line-clamp-3">{reel.description}</p>
                    ) : (
                      <div>
                        <p className="line-clamp-2">{reel.description.substring(0, window.innerWidth < 640 ? 80 : 100)}...</p>
                        <button
                          onClick={() => toggleDescription(reel.id)}
                          className="text-blue-400 hover:text-blue-300 underline mt-1 text-xs"
                        >
                          ...more
                        </button>
                      </div>
                    )}
                    {expandedDescriptions.has(reel.id) && reel.description.length > (window.innerWidth < 640 ? 80 : 100) && (
                      <button
                        onClick={() => toggleDescription(reel.id)}
                        className="text-blue-400 hover:text-blue-300 underline mt-1 text-xs"
                      >
                        ...less
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="absolute right-2 sm:right-4 bottom-16 sm:bottom-20 flex flex-col gap-2 sm:gap-4">
              {/* Delete Button (for video creator) */}
              {user?.id === reel.user_id && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-500/50 text-white hover:bg-red-500/70 flex flex-col items-center gap-1"
                    >
                      <Trash2 className="h-4 w-4 sm:h-6 sm:w-6" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Video</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this video? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteVideo(reel.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {/* Like Button */}
              <Button
                onClick={() => handleLike(reel.id)}
                variant="ghost"
                size="sm"
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex flex-col items-center gap-1 transition-all duration-1000 bg-black/50 text-white hover:bg-black/70 ${
                  animatingLikes.has(reel.id) 
                    ? 'scale-125 shadow-lg shadow-red-500/50' 
                    : ''
                }`}
              >
                <Heart 
                  className={`h-4 w-4 sm:h-6 sm:w-6 transition-all duration-1000 ${
                    likedVideos.has(reel.id) ? 'fill-current text-red-500' : 'text-white'
                  } ${
                    animatingLikes.has(reel.id) ? 'scale-110 fill-current text-red-500' : ''
                  }`} 
                />
                <span className="text-[10px] sm:text-xs">{reel.video_likes.length}</span>
              </Button>

              {/* Comment Button */}
              <Button
                onClick={() => setShowComments(true)}
                variant="ghost"
                size="sm"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 text-white hover:bg-black/70 flex flex-col items-center gap-1"
              >
                <MessageCircle className="h-4 w-4 sm:h-6 sm:w-6" />
                <span className="text-[10px] sm:text-xs">{reel.video_comments.length}</span>
              </Button>

              {/* Share Button */}
              <Button
                onClick={handleShare}
                variant="ghost"
                size="sm"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 text-white hover:bg-black/70 flex flex-col items-center gap-1"
              >
                <Share className="h-4 w-4 sm:h-6 sm:w-6" />
              </Button>
            </div>

            {/* Video Controls */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Button
                onClick={togglePlayPause}
                variant="ghost"
                size="lg"
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                {isPlaying ? <Pause className="h-6 w-6 sm:h-8 sm:w-8" /> : <Play className="h-6 w-6 sm:h-8 sm:w-8" />}
              </Button>
            </div>

            {/* Mute Button */}
            <div className="absolute top-2 right-12 sm:top-4 sm:right-16">
              <Button
                onClick={toggleMute}
                variant="ghost"
                size="sm"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                {isMuted ? <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" /> : <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Instagram-style Comments Dialog */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="max-w-md mx-auto h-[85vh] sm:h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-3 sm:p-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="fredoka-bold text-sm sm:text-base">Comments</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(false)}
                className="h-6 w-6 sm:h-8 sm:w-8 p-0"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
            <DialogDescription className="sr-only">
              View and add comments for this video
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
            {reels[currentIndex]?.video_comments.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <MessageCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm sm:text-base">No comments yet</p>
                <p className="text-xs sm:text-sm">Be the first to comment!</p>
              </div>
            ) : (
              reels[currentIndex]?.video_comments.map((comment) => (
                <div 
                  key={comment.id} 
                  className={`flex gap-2 sm:gap-3 p-2 rounded-lg transition-colors ${
                    (user?.id === comment.user_id || user?.id === reels[currentIndex]?.user_id) 
                      ? 'hover:bg-red-50 cursor-pointer' 
                      : ''
                  }`}
                  onMouseDown={() => {
                    if (user?.id === comment.user_id || user?.id === reels[currentIndex]?.user_id) {
                      handleCommentLongPress(comment.id);
                    }
                  }}
                  onMouseUp={handleCommentPressEnd}
                  onMouseLeave={handleCommentPressEnd}
                  onTouchStart={() => {
                    if (user?.id === comment.user_id || user?.id === reels[currentIndex]?.user_id) {
                      handleCommentLongPress(comment.id);
                    }
                  }}
                  onTouchEnd={handleCommentPressEnd}
                  title={(user?.id === comment.user_id || user?.id === reels[currentIndex]?.user_id) ? "Long press to delete" : ""}
                >
                  <Avatar className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0">
                    <AvatarImage src={comment.profiles?.profile_picture_url} />
                    <AvatarFallback className="text-xs">
                      {comment.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 sm:gap-2 mb-1">
                      <span className="font-semibold text-xs sm:text-sm fredoka-medium">
                        {comment.profiles?.full_name}
                      </span>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {format(new Date(comment.created_at), 'MMM d')}
                      </span>
                      {(user?.id === comment.user_id || user?.id === reels[currentIndex]?.user_id) && (
                        <span className="text-xs text-gray-400 ml-auto">
                          Long press to delete
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-800 fredoka-medium leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-3 sm:p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleComment();
                  }
                }}
              />
              <Button
                onClick={handleComment}
                disabled={!newComment.trim() || isSubmittingComment}
                size="sm"
                className="px-2 sm:px-3"
              >
                <Send className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tukio;
