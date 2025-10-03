import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Heart, 
  MessageCircle, 
  MoreHorizontal, 
  Edit3, 
  Trash2,
  Play,
  Image as ImageIcon,
  Video,
  MapPin,
  GraduationCap,
  Calendar,
  ThumbsDown,
  X
} from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AchievementMediaCarousel } from "./AchievementMediaCarousel";
import { AchievementComments } from "./AchievementComments";

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

interface AchievementPostProps {
  achievement: {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    created_at: string;
    updated_at: string;
    author_name: string;
    author_email: string;
    author_picture?: string;
    university_name?: string;
    course_name?: string;
    course_year?: number;
    semester?: number;
    course_group?: string;
    country_name?: string;
    media_count: number;
    likes_count: number;
    dislikes_count: number;
    comments_count: number;
    views_count: number;
    user_liked: boolean;
    user_disliked?: boolean;
  };
  onEdit?: (achievement: any) => void;
  onDelete?: (achievementId: string) => void;
  showComments?: boolean;
}

export function AchievementPost({ 
  achievement, 
  onEdit, 
  onDelete, 
  showComments = false 
}: AchievementPostProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(achievement.user_liked);
  const [isDisliked, setIsDisliked] = useState(achievement.user_disliked || false);
  const [likesCount, setLikesCount] = useState(achievement.likes_count);
  const [dislikesCount, setDislikesCount] = useState(achievement.dislikes_count || 0);
  const [commentsCount, setCommentsCount] = useState(achievement.comments_count);
  const [media, setMedia] = useState<AchievementMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCommentsSection, setShowCommentsSection] = useState(showComments);

  const isOwnPost = user?.id === achievement.user_id;

  useEffect(() => {
    fetchMedia();
    recordView();
  }, [achievement.id]);

  const fetchMedia = async () => {
    try {
      // Use direct query for now (RPC functions will be available after SQL script is run)
      console.log('Using direct query for achievement media');
      const directResult = await supabase
        .from('achievement_media')
        .select('*')
        .eq('achievement_id', achievement.id)
        .order('order_index', { ascending: true });
      
      const data = directResult.data;
      const error = directResult.error;

      if (error) throw error;
      setMedia(data || []);
    } catch (error) {
      console.error('Error fetching media:', error);
    }
  };

  const recordView = async () => {
    try {
      await supabase
        .from('achievement_views')
        .insert({
          achievement_id: achievement.id,
          user_id: user?.id || null
        });
    } catch (error) {
      // Ignore duplicate view errors
      console.log('View already recorded or user not authenticated');
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to like achievements.",
        variant: "destructive",
      });
      return;
    }

    // Optimistic update - update UI immediately for instant response
    const wasLiked = isLiked;
    const wasDisliked = isDisliked;
    
    setIsLiked(!wasLiked);
    setLikesCount(prev => wasLiked ? Math.max(0, prev - 1) : prev + 1);
    
    // If liking, remove dislike
    if (!wasLiked && wasDisliked) {
      setIsDisliked(false);
      setDislikesCount(prev => Math.max(0, prev - 1));
    }

    try {
      if (wasLiked) {
        // Unlike - remove the like
        const { error } = await supabase
          .from('achievement_likes')
          .delete()
          .eq('achievement_id', achievement.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Like - first remove any existing like, then add new one
        await supabase
          .from('achievement_likes')
          .delete()
          .eq('achievement_id', achievement.id)
          .eq('user_id', user.id);

        const { error } = await supabase
          .from('achievement_likes')
          .insert({
            achievement_id: achievement.id,
            user_id: user.id
          });

        if (error) throw error;

        // Remove dislike if it existed
        if (wasDisliked) {
          await supabase
            .from('achievement_dislikes')
            .delete()
            .eq('achievement_id', achievement.id)
            .eq('user_id', user.id);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update on error
      setIsLiked(wasLiked);
      setLikesCount(prev => wasLiked ? prev + 1 : Math.max(0, prev - 1));
      if (wasDisliked) {
        setIsDisliked(true);
        setDislikesCount(prev => prev + 1);
      }
      toast({
        title: "Error",
        description: "Failed to update like status.",
        variant: "destructive",
      });
    }
  };

  const handleDislike = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to dislike achievements.",
        variant: "destructive",
      });
      return;
    }

    // Optimistic update - update UI immediately for instant response
    const wasDisliked = isDisliked;
    const wasLiked = isLiked;
    
    setIsDisliked(!wasDisliked);
    setDislikesCount(prev => wasDisliked ? Math.max(0, prev - 1) : prev + 1);
    
    // If disliking, remove like
    if (!wasDisliked && wasLiked) {
      setIsLiked(false);
      setLikesCount(prev => Math.max(0, prev - 1));
    }

    try {
      if (wasDisliked) {
        // Remove dislike
        const { error } = await supabase
          .from('achievement_dislikes')
          .delete()
          .eq('achievement_id', achievement.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Add dislike and remove like if exists
        const { error: dislikeError } = await supabase
          .from('achievement_dislikes')
          .upsert({
            achievement_id: achievement.id,
            user_id: user.id
          });

        if (dislikeError) throw dislikeError;

        // Remove like if it existed
        if (wasLiked) {
          await supabase
            .from('achievement_likes')
            .delete()
            .eq('achievement_id', achievement.id)
            .eq('user_id', user.id);
        }
      }
    } catch (error) {
      console.error('Error disliking:', error);
      // Revert optimistic update on error
      setIsDisliked(wasDisliked);
      setDislikesCount(prev => wasDisliked ? prev + 1 : Math.max(0, prev - 1));
      if (wasLiked) {
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
      toast({
        title: "Error",
        description: "Failed to update dislike status.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this achievement?')) return;

    try {
      const { error } = await supabase
        .from('achievements')
        .delete()
        .eq('id', achievement.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Achievement deleted successfully.",
      });

      onDelete?.(achievement.id);
    } catch (error) {
      console.error('Error deleting achievement:', error);
      toast({
        title: "Error",
        description: "Failed to delete achievement.",
        variant: "destructive",
      });
    }
  };

  const getMediaIcon = (mediaType: string) => {
    const IconComponent = mediaType === 'video' ? Video : ImageIcon;
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full">
      {media.length > 0 ? (
        <div className="relative h-64 sm:h-80 bg-gradient-to-br from-blue-500 to-purple-600">
          <img
            src={media[0].media_url}
            alt={achievement.title}
            className="w-full h-full object-cover"
          />
          
          {/* TikTok-style overlay with gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
            
            {/* Top section - User info and actions - Mobile Optimized */}
            <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                  <Avatar className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-white/20 flex-shrink-0">
                    <AvatarImage src={achievement.author_picture} />
                    <AvatarFallback className="text-xs bg-white/20 text-white">
                      {achievement.author_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-white min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium truncate">{achievement.author_name}</p>
                    <p className="text-xs text-white/80 truncate">{achievement.university_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  {isOwnPost && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-white hover:bg-white/20">
                          <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit?.(achievement)}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={handleDelete}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom section - Title and description - Mobile Optimized */}
            <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4">
              <h3 className="text-white font-bold text-base sm:text-xl mb-1 sm:mb-2 line-clamp-2">
                {achievement.title}
              </h3>
              
              {achievement.description && (
                <p className="text-white/90 text-xs sm:text-sm leading-relaxed line-clamp-2">
                  {achievement.description}
                </p>
              )}

              {/* Achievement details - Mobile Optimized */}
              <div className="mt-2 sm:mt-3 space-y-1">
                {achievement.course_name && (
                  <div className="flex items-center gap-1.5 sm:gap-2 text-white/80 text-xs">
                    <GraduationCap className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{achievement.course_name}</span>
                  </div>
                )}
                
                {achievement.country_name && (
                  <div className="flex items-center gap-1.5 sm:gap-2 text-white/80 text-xs">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{achievement.country_name}</span>
                  </div>
                )}

                {/* Time posted */}
                <div className="flex items-center gap-1.5 sm:gap-2 text-white/60 text-xs">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  <span>{format(new Date(achievement.created_at), 'MMM dd, yyyy')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Fallback for achievements without media - Mobile Optimized
        <div className="p-4 sm:p-6">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <CardTitle className="text-base sm:text-lg line-clamp-2 flex-1 min-w-0">{achievement.title}</CardTitle>
                  {isOwnPost && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0">
                          <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit?.(achievement)}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={handleDelete}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Avatar className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0">
                    <AvatarImage src={achievement.author_picture} />
                    <AvatarFallback className="text-xs">
                      {achievement.author_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{achievement.author_name}</span>
                  {achievement.university_name && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span className="truncate hidden sm:inline">{achievement.university_name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {achievement.description && (
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 leading-relaxed line-clamp-3">
                {achievement.description}
              </p>
            )}
          </CardContent>
        </div>
      )}

      {/* Bottom section - Action buttons with counts - Mobile Optimized */}
      <div className="p-2 sm:p-3 border-t bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-3 sm:gap-4 lg:gap-6">
          {/* Like button with count */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-md transition-all duration-200 touch-manipulation ${
                isLiked 
                  ? 'text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30' 
                  : 'text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isLiked ? 'fill-current' : ''}`} />
            </Button>
            <span className="text-xs text-muted-foreground font-medium min-w-[16px] sm:min-w-[20px] text-center">
              {likesCount}
            </span>
          </div>
          
          {/* Dislike button with count */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDislike}
              className={`h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-md transition-all duration-200 touch-manipulation ${
                isDisliked 
                  ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30' 
                  : 'text-muted-foreground hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20'
              }`}
            >
              <ThumbsDown className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isDisliked ? 'fill-current' : ''}`} />
            </Button>
            <span className="text-xs text-muted-foreground font-medium min-w-[16px] sm:min-w-[20px] text-center">
              {dislikesCount}
            </span>
          </div>
          
          {/* Comment button with count */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCommentsSection(!showCommentsSection)}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-md transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 touch-manipulation"
            >
              <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <span className="text-xs text-muted-foreground font-medium min-w-[16px] sm:min-w-[20px] text-center">
              {commentsCount}
            </span>
          </div>
          
        </div>
      </div>

      {/* Comments Popup Modal - Mobile Optimized */}
      {showCommentsSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] sm:max-h-[80vh] flex flex-col">
            {/* Header - Mobile Optimized */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b">
              <h3 className="text-base sm:text-lg font-semibold">Comments</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCommentsSection(false)}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 touch-manipulation"
              >
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
            
            {/* Comments Content */}
            <div className="flex-1 overflow-hidden">
              <AchievementComments 
                achievementId={achievement.id}
                onCommentAdded={() => setCommentsCount(prev => prev + 1)}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
