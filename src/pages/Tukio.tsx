import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Share, Volume2, VolumeX, Play, Pause, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface Reel {
  id: string;
  title: string;
  content: string;
  media_url: string;
  media_type: string;
  created_at: string;
  universities: {
    name: string;
    countries: {
      name: string;
    };
  };
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
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchReels();
    }
  }, [user]);

  const fetchReels = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          universities(
            name,
            countries(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReels(data || []);
    } catch (error) {
      console.error('Error fetching reels:', error);
      toast({
        title: "Error",
        description: "Failed to load reels.",
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

  const handleLike = () => {
    toast({
      title: "Liked!",
      description: "You liked this reel.",
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
          <h2 className="text-2xl font-bold mb-4">No reels available</h2>
          <p className="text-gray-400 mb-6">Check back later for new content!</p>
          <Button onClick={() => navigate('/dashboard')} variant="outline" className="text-white border-white">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
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
            {/* Media */}
            {reel.media_url && (
              <div className="absolute inset-0">
                {reel.media_type?.startsWith('video/') ? (
                  <video
                    ref={el => videoRefs.current[index] = el}
                    src={reel.media_url}
                    className="w-full h-full object-cover"
                    onClick={handleVideoClick}
                    muted={isMuted}
                    loop
                    playsInline
                    autoPlay={index === currentIndex}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                ) : reel.media_type?.startsWith('image/') ? (
                  <img
                    src={reel.media_url}
                    alt={reel.title}
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              {/* University Info */}
              <div className="mb-4">
                <p className="text-sm text-gray-300">
                  {reel.universities?.name} • {reel.universities?.countries?.name}
                </p>
                <p className="text-xs text-gray-400">
                  {format(new Date(reel.created_at), 'MMM dd, yyyy')}
                </p>
              </div>

              {/* Title and Content */}
              <h3 className="text-xl font-bold mb-2 fredoka-bold">
                {reel.title}
              </h3>
              <p className="text-sm text-gray-200 mb-4 fredoka-medium">
                {reel.content}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="absolute right-4 bottom-20 flex flex-col gap-4">
              {/* Like Button */}
              <Button
                onClick={handleLike}
                variant="ghost"
                size="sm"
                className="w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <Heart className="h-6 w-6" />
              </Button>

              {/* Comment Button */}
              <Button
                variant="ghost"
                size="sm"
                className="w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <MessageCircle className="h-6 w-6" />
              </Button>

              {/* Share Button */}
              <Button
                onClick={handleShare}
                variant="ghost"
                size="sm"
                className="w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <Share className="h-6 w-6" />
              </Button>
            </div>

            {/* Video Controls */}
            {reel.media_type?.startsWith('video/') && (
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
            )}

            {/* Mute Button */}
            {reel.media_type?.startsWith('video/') && (
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tukio;
