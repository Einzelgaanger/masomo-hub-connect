import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Share, Volume2, VolumeX, Play, Pause, ChevronLeft, X, Send, Trash2, MoreVertical, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [animatingLikes, setAnimatingLikes] = useState<Set<string>>(new Set());
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchReels();
    }
  }, [user]);

  const fetchReels = async () => {
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
          return;
        } else {
          throw videosError;
        }
      }

      if (!videos || videos.length === 0) {
        setReels([]);
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

  const handleScroll = (e: React.WheelEvent) => {
    e.preventDefault();
    
    if (e.deltaY > 0 && currentIndex < reels.length - 1) {
      // Scroll down - next reel
      setCurrentIndex(prev => prev + 1);
    } else if (e.deltaY < 0 && currentIndex > 0) {
      // Scroll up - previous reel
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const startY = e.touches[0].clientY;
    
    const handleTouchEnd = (e: React.TouchEvent) => {
      const endY = e.changedTouches[0].clientY;
      const deltaY = startY - endY;
      
      if (Math.abs(deltaY) > 50) {
        if (deltaY > 0 && currentIndex < reels.length - 1) {
          // Swipe up - next reel
          setCurrentIndex(prev => prev + 1);
        } else if (deltaY < 0 && currentIndex > 0) {
          // Swipe down - previous reel
          setCurrentIndex(prev => prev - 1);
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
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    const video = videoRefs.current[currentIndex];
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePlayPause();
  };

  const handleLike = async (videoId: string) => {
    if (!user) return;

    // Add animation immediately for instant feedback
    setAnimatingLikes(prev => new Set(prev).add(videoId));
    
    // Remove animation after 300ms
    setTimeout(() => {
      setAnimatingLikes(prev => {
        const newSet = new Set(prev);
        newSet.delete(videoId);
        return newSet;
      });
    }, 300);

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
      onWheel={handleScroll}
      onTouchStart={handleTouchStart}
    >
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-50">
        <Button
          onClick={() => navigate('/dashboard')}
          variant="ghost"
          size="sm"
          className="bg-black/50 text-white hover:bg-black/70"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Progress Indicator */}
      <div className="absolute top-4 right-4 z-50">
        <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {reels.length}
        </div>
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
                <video
                  ref={el => videoRefs.current[index] = el}
                  src={reel.video_url}
                  className="max-w-full max-h-full object-contain"
                  onClick={handleVideoClick}
                  muted={isMuted}
                  loop
                  playsInline
                  autoPlay={index === currentIndex}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  poster={reel.thumbnail_url}
                />
              </div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              {/* Profile Info */}
              <div className="mb-4 flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-full overflow-hidden border-2 border-white cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => navigate(`/profile/${reel.user_id}`)}
                >
                  <img
                    src={reel.profiles?.profile_picture_url || '/default-avatar.png'}
                    alt={reel.profiles?.full_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div 
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => navigate(`/profile/${reel.user_id}`)}
                  >
                    <h4 className="font-bold text-lg fredoka-bold hover:underline">
                      {reel.profiles?.full_name}
                    </h4>
                    <span className="text-xs text-gray-300">
                      {format(new Date(reel.created_at), 'MMM dd')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300">
                    {reel.profiles?.follower_count} followers
                  </p>
                </div>
              </div>

              {/* Title and Description */}
              <h3 className="text-xl font-bold mb-2 fredoka-bold">
                {reel.title}
              </h3>
              <div className="text-sm text-gray-200 mb-4 fredoka-medium">
                {reel.description && (
                  <div>
                    {expandedDescriptions.has(reel.id) || reel.description.length <= 100 ? (
                      <p>{reel.description}</p>
                    ) : (
                      <div>
                        <p>{reel.description.substring(0, 100)}...</p>
                        <button
                          onClick={() => toggleDescription(reel.id)}
                          className="text-blue-400 hover:text-blue-300 underline mt-1"
                        >
                          ...more
                        </button>
                      </div>
                    )}
                    {expandedDescriptions.has(reel.id) && reel.description.length > 100 && (
                      <button
                        onClick={() => toggleDescription(reel.id)}
                        className="text-blue-400 hover:text-blue-300 underline mt-1"
                      >
                        ...less
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="absolute right-4 bottom-20 flex flex-col gap-4">
              {/* Delete Button (for video creator) */}
              {user?.id === reel.user_id && (
                <Button
                  onClick={() => handleDeleteVideo(reel.id)}
                  variant="ghost"
                  size="sm"
                  className="w-12 h-12 rounded-full bg-red-500/50 text-white hover:bg-red-500/70 flex flex-col items-center gap-1"
                >
                  <Trash2 className="h-6 w-6" />
                </Button>
              )}

              {/* Like Button */}
              <Button
                onClick={() => handleLike(reel.id)}
                variant="ghost"
                size="sm"
                className={`w-12 h-12 rounded-full flex flex-col items-center gap-1 transition-all duration-300 ${
                  likedVideos.has(reel.id) 
                    ? 'bg-red-500/50 text-red-400 hover:bg-red-500/70' 
                    : 'bg-black/50 text-white hover:bg-black/70'
                } ${
                  animatingLikes.has(reel.id) 
                    ? 'scale-125 bg-red-500/80 shadow-lg shadow-red-500/50' 
                    : ''
                }`}
              >
                <Heart 
                  className={`h-6 w-6 transition-all duration-300 ${
                    likedVideos.has(reel.id) ? 'fill-current' : ''
                  } ${
                    animatingLikes.has(reel.id) ? 'scale-110 fill-current text-red-400' : ''
                  }`} 
                />
                <span className="text-xs">{reel.video_likes.length}</span>
              </Button>

              {/* Comment Button */}
              <Button
                onClick={() => setShowComments(true)}
                variant="ghost"
                size="sm"
                className="w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70 flex flex-col items-center gap-1"
              >
                <MessageCircle className="h-6 w-6" />
                <span className="text-xs">{reel.video_comments.length}</span>
              </Button>

              {/* Share Button */}
              <Button
                onClick={handleShare}
                variant="ghost"
                size="sm"
                className="w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70 flex flex-col items-center gap-1"
              >
                <Share className="h-6 w-6" />
              </Button>
            </div>

            {/* Video Controls */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Button
                onClick={togglePlayPause}
                variant="ghost"
                size="lg"
                className="w-16 h-16 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
              </Button>
            </div>

            {/* Mute Button */}
            <div className="absolute top-4 right-16">
              <Button
                onClick={toggleMute}
                variant="ghost"
                size="sm"
                className="w-10 h-10 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Instagram-style Comments Dialog */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="max-w-md mx-auto h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="fredoka-bold">Comments</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {reels[currentIndex]?.video_comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No comments yet</p>
                <p className="text-sm">Be the first to comment!</p>
              </div>
            ) : (
              reels[currentIndex]?.video_comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={comment.profiles?.profile_picture_url} />
                    <AvatarFallback className="text-xs">
                      {comment.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm fredoka-medium">
                        {comment.profiles?.full_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(comment.created_at), 'MMM d')}
                      </span>
                      {(user?.id === comment.user_id || user?.id === reels[currentIndex]?.user_id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="h-6 w-6 p-0 ml-auto text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-gray-800 fredoka-medium">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1"
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
                className="px-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tukio;
