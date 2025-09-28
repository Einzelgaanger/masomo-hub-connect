import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Video,
  Download
} from "lucide-react";

interface AchievementMedia {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
  thumbnail_url?: string;
  file_name?: string;
  file_size?: number;
  duration?: number;
  order_index: number;
}

interface AchievementMediaCarouselProps {
  media: AchievementMedia[];
}

export function AchievementMediaCarousel({ media }: AchievementMediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const currentMedia = media[currentIndex];

  useEffect(() => {
    // Pause all videos when switching media
    videoRefs.current.forEach(video => {
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    });
    setIsPlaying(false);
  }, [currentIndex]);

  const nextMedia = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const prevMedia = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  const togglePlayPause = () => {
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      if (isPlaying) {
        currentVideo.pause();
      } else {
        currentVideo.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      currentVideo.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!media.length) return null;

  return (
    <div className="relative w-full">
      {/* Media Container */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {currentMedia.media_type === 'image' ? (
          <img
            src={currentMedia.media_url}
            alt={currentMedia.file_name || 'Achievement media'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="relative w-full h-full">
            <video
              ref={(el) => (videoRefs.current[currentIndex] = el)}
              src={currentMedia.media_url}
              poster={currentMedia.thumbnail_url}
              className="w-full h-full object-cover"
              muted={isMuted}
              onEnded={handleVideoEnded}
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              playsInline
            />
            
            {/* Video Controls Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
              <Button
                variant="secondary"
                size="lg"
                className="rounded-full h-16 w-16"
                onClick={togglePlayPause}
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8" />
                )}
              </Button>
            </div>

            {/* Video Info */}
            <div className="absolute top-2 right-2 flex gap-2">
              {currentMedia.duration && (
                <Badge variant="secondary" className="bg-black bg-opacity-70 text-white">
                  {formatDuration(currentMedia.duration)}
                </Badge>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full h-8 w-8 p-0 bg-black bg-opacity-70 hover:bg-opacity-90"
                onClick={toggleMute}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Navigation Arrows */}
        {media.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="sm"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 rounded-full h-8 w-8 p-0 bg-black bg-opacity-50 hover:bg-opacity-70"
              onClick={prevMedia}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full h-8 w-8 p-0 bg-black bg-opacity-50 hover:bg-opacity-70"
              onClick={nextMedia}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Media Info */}
      <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          {currentMedia.media_type === 'video' ? (
            <Video className="h-4 w-4" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
          <span>
            {currentIndex + 1} of {media.length}
          </span>
          {currentMedia.file_name && (
            <span className="truncate max-w-32">
              {currentMedia.file_name}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {currentMedia.file_size && (
            <span>{formatFileSize(currentMedia.file_size)}</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => {
              const link = document.createElement('a');
              link.href = currentMedia.media_url;
              link.download = currentMedia.file_name || 'achievement-media';
              link.target = '_blank';
              link.click();
            }}
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Dots Indicator */}
      {media.length > 1 && (
        <div className="flex justify-center mt-3 space-x-2">
          {media.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-primary' : 'bg-muted'
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
