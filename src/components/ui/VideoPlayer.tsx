import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Video, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  showControls?: boolean;
}

export function VideoPlayer({
  src,
  poster,
  className = "",
  autoPlay = true,
  muted = true,
  loop = true,
  controls = true,
  showControls = true
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControlsOverlay, setShowControlsOverlay] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Check if this is a missing video file
    if (src === '/video/demo.mp4') {
      // Show TikTok-like placeholder immediately
      setTimeout(() => {
        setHasError(true);
        setIsLoading(false);
      }, 100);
      return;
    }

    if (autoPlay) {
      // Try to play with sound first, if that fails, try muted
      video.muted = false;
      setIsMuted(false);
      video.play().catch(() => {
        // If autoplay with sound fails, try muted autoplay
        video.muted = true;
        setIsMuted(true);
        video.play().catch(error => {
          console.warn("Autoplay prevented:", error);
          // If autoplay is prevented, show play button overlay
          setAutoplayBlocked(true);
          setShowControlsOverlay(true);
        });
      });
    }
  }, [autoPlay, src]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!document.fullscreenElement) {
      video.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleMouseEnter = () => {
    if (showControls) {
      setShowControlsOverlay(true);
    }
  };

  const handleMouseLeave = () => {
    if (showControls) {
      setShowControlsOverlay(false);
    }
  };

  return (
    <div 
      className={`relative group ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover rounded-lg"
        muted={muted}
        loop={loop}
        playsInline
        autoPlay={autoPlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onVolumeChange={() => setIsMuted(videoRef.current?.muted || false)}
        onLoadStart={() => {
          setIsLoading(true);
        }}
        onCanPlay={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />

      {/* Bunifu Promotional Animation */}
      {hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 flex flex-col items-center justify-center text-white overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0">
            <div className="absolute top-4 left-4 w-32 h-32 bg-white/5 rounded-full animate-ping"></div>
            <div className="absolute top-1/4 right-8 w-24 h-24 bg-white/5 rounded-full animate-ping animation-delay-500"></div>
            <div className="absolute bottom-1/4 left-8 w-20 h-20 bg-white/5 rounded-full animate-ping animation-delay-1000"></div>
            <div className="absolute bottom-8 right-12 w-28 h-28 bg-white/5 rounded-full animate-ping animation-delay-1500"></div>
          </div>
          
          <div className="text-center relative z-10 px-4">
            {/* Animated Bunifu Logo/Icon */}
            <div className="mb-8">
              <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center mx-auto animate-pulse backdrop-blur-sm border-2 border-white/30">
                <span className="text-4xl font-bold">B</span>
              </div>
            </div>
            
            {/* Main Content */}
            <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-pulse">
              BUNIFU
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-6 font-semibold">
              Your University Hub
            </p>
            
            {/* Feature Highlights */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center justify-center space-x-2 animate-bounce">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <p className="text-lg">Connect with Classmates</p>
              </div>
              <div className="flex items-center justify-center space-x-2 animate-bounce animation-delay-200">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <p className="text-lg">Share Achievements</p>
              </div>
              <div className="flex items-center justify-center space-x-2 animate-bounce animation-delay-400">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <p className="text-lg">Track Your Progress</p>
              </div>
            </div>
            
            {/* Call to Action */}
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-8 py-3 inline-block border-2 border-white/40 animate-pulse">
              <p className="text-lg font-bold">Join the Community</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col items-center justify-center text-gray-600">
          <Video className="h-12 w-12 mb-4 text-blue-400 animate-pulse" />
          <h3 className="text-lg font-semibold mb-2">Loading Video</h3>
          <p className="text-sm text-center px-4">
            Preparing your demo experience...
          </p>
        </div>
      )}

      {/* TikTok-like Play Button Overlay */}
      {autoplayBlocked && !hasError && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="text-center">
            <button
              onClick={() => {
                const video = videoRef.current;
                if (video) {
                  video.muted = false;
                  video.play();
                  setAutoplayBlocked(false);
                  setShowControlsOverlay(false);
                }
              }}
              title="Play video with sound"
              className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors duration-200 shadow-2xl"
            >
              <Play className="h-8 w-8 text-gray-800 ml-1" />
            </button>
            <p className="text-white text-sm mt-4 font-medium">
              Click to play with sound
            </p>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      {showControls && !hasError && !autoplayBlocked && (
        <div 
          className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-300 ${
            showControlsOverlay ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex items-center gap-2 bg-black/50 rounded-lg p-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={togglePlay}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleMute}
              className="text-white hover:bg-white/20"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
