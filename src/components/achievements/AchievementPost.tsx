import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  Calendar
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
        // Unlike
        const { error } = await supabase
          .from('achievement_likes')
          .delete()
          .eq('achievement_id', achievement.id)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        // Like
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
    return mediaType === 'video' ? Video : ImageIcon;
  };

  return (
    <Card className="w-full shadow-lg border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <Avatar className="h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0">
              <AvatarImage src={achievement.author_picture} />
              <AvatarFallback className="text-sm font-semibold">
                {achievement.author_name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 truncate">
                  {achievement.author_name}
                </h3>
                {achievement.university_name && (
                  <Badge variant="outline" className="text-xs w-fit bg-primary/10 text-primary border-primary/20">
                    {achievement.university_name}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{format(new Date(achievement.created_at), 'MMM dd, yyyy')}</span>
                </div>
                {achievement.course_name && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <div className="flex items-center gap-1">
                      <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="truncate">{achievement.course_name}</span>
                    </div>
                  </>
                )}
                {achievement.country_name && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="truncate">{achievement.country_name}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
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
      </CardHeader>

      <CardContent className="pt-0 space-y-6">
        {/* Title and Description */}
        <div className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
            {achievement.title}
          </h2>
          {achievement.description && (
            <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {achievement.description}
            </p>
          )}
        </div>

        {/* Media Carousel */}
        {media.length > 0 && (
          <div className="rounded-xl overflow-hidden">
            <AchievementMediaCarousel media={media} />
          </div>
        )}

        {/* Stats and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-full">
              <Eye className="h-4 w-4" />
              <span className="font-medium">{viewsCount}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-full">
              <Heart className="h-4 w-4" />
              <span className="font-medium">{likesCount}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-full">
              <MessageCircle className="h-4 w-4" />
              <span className="font-medium">{commentsCount}</span>
            </div>
            {media.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-full">
                {getMediaIcon(media[0]?.media_type || 'image')}
                <span className="font-medium">{media.length}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={loading}
              className={`h-10 px-4 rounded-xl transition-all duration-200 ${
                isLiked 
                  ? 'text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30' 
                  : 'text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
              }`}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="ml-2 hidden sm:inline">Like</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCommentsSection(!showCommentsSection)}
              className="h-10 px-4 rounded-xl transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="ml-2 hidden sm:inline">Comment</span>
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        {showCommentsSection && (
          <div className="mt-4 pt-4 border-t">
            <AchievementComments 
              achievementId={achievement.id}
              onCommentAdded={() => setCommentsCount(prev => prev + 1)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
