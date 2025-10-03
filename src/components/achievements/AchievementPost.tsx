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
  Eye, 
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
    comments_count: number;
    views_count: number;
    user_liked: boolean;
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
  const [likesCount, setLikesCount] = useState(achievement.likes_count);
  const [commentsCount, setCommentsCount] = useState(achievement.comments_count);
  const [viewsCount, setViewsCount] = useState(achievement.views_count);
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

    setLoading(true);
    try {
      if (isLiked) {
        // Unlike - remove the like
        const { error } = await supabase
          .from('achievement_likes')
          .delete()
          .eq('achievement_id', achievement.id)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
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
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like status.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

    setLoading(true);
    try {
      // Remove like if exists (dislike = remove like)
      const { error } = await supabase
        .from('achievement_likes')
        .delete()
        .eq('achievement_id', achievement.id)
        .eq('user_id', user.id);

      if (error) throw error;
      setIsLiked(false);
      setLikesCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error disliking:', error);
      toast({
        title: "Error",
        description: "Failed to update dislike status.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
        <div className="relative h-80 bg-gradient-to-br from-blue-500 to-purple-600">
          <img
            src={media[0].media_url}
            alt={achievement.title}
            className="w-full h-full object-cover"
          />
          
          {/* TikTok-style overlay with gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
            
            {/* Top section - User info and actions */}
            <div className="absolute top-4 left-4 right-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border-2 border-white/20">
                    <AvatarImage src={achievement.author_picture} />
                    <AvatarFallback className="text-xs bg-white/20 text-white">
                      {achievement.author_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-white">
                    <p className="text-sm font-medium">{achievement.author_name}</p>
                    <p className="text-xs text-white/80">{achievement.university_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isOwnPost && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:bg-white/20">
                          <MoreHorizontal className="h-4 w-4" />
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

            {/* Bottom section - Title and description */}
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-white font-bold text-xl mb-2">
                {achievement.title}
              </h3>
              
              {achievement.description && (
                <p className="text-white/90 text-sm leading-relaxed line-clamp-2">
                  {achievement.description}
                </p>
              )}

              {/* Achievement details */}
              <div className="mt-3 space-y-1">
                {achievement.course_name && (
                  <div className="flex items-center gap-2 text-white/80 text-xs">
                    <GraduationCap className="h-3 w-3" />
                    <span>{achievement.course_name}</span>
                  </div>
                )}
                
                {achievement.country_name && (
                  <div className="flex items-center gap-2 text-white/80 text-xs">
                    <MapPin className="h-3 w-3" />
                    <span>{achievement.country_name}</span>
                  </div>
                )}

                {/* Time posted */}
                <div className="flex items-center gap-2 text-white/60 text-xs">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(achievement.created_at), 'MMM dd, yyyy')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Fallback for achievements without media
        <div className="p-6">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-lg">{achievement.title}</CardTitle>
                  {isOwnPost && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
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
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={achievement.author_picture} />
                    <AvatarFallback className="text-xs">
                      {achievement.author_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span>{achievement.author_name}</span>
                  {achievement.university_name && (
                    <>
                      <span>•</span>
                      <span>{achievement.university_name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {achievement.description && (
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-3">
                {achievement.description}
              </p>
            )}
          </CardContent>
        </div>
      )}

      {/* Bottom section - Action buttons */}
      <div className="p-3 border-t bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          {/* Like button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={loading}
            className={`h-8 w-8 p-0 rounded-md transition-all duration-200 ${
              isLiked 
                ? 'text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30' 
                : 'text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
          </Button>
          
          {/* Dislike button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDislike}
            disabled={loading}
            className="h-8 w-8 p-0 rounded-md transition-all duration-200 text-muted-foreground hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20"
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
          
          {/* Comment button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCommentsSection(!showCommentsSection)}
            className="h-8 w-8 p-0 rounded-md transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Comments Popup Modal */}
      {showCommentsSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Comments</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCommentsSection(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
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
