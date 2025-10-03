import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Send, 
  MoreHorizontal, 
  Edit3, 
  Trash2,
  Reply
} from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Comment {
  id: string;
  achievement_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_picture?: string;
}

interface AchievementCommentsProps {
  achievementId: string;
  onCommentAdded?: () => void;
  limit?: number;
}

export function AchievementComments({ 
  achievementId, 
  onCommentAdded,
  limit = 50 
}: AchievementCommentsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchComments();
  }, [achievementId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      
      // Fetch comments and profiles separately to avoid foreign key issues
      const { data: commentsData, error: commentsError } = await supabase
        .from('achievement_comments')
        .select('*')
        .eq('achievement_id', achievementId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (commentsError) throw commentsError;

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
      
      // Fetch profiles for all users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, profile_picture_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine data
      const transformedData = commentsData.map(comment => {
        const profile = profilesData?.find(p => p.user_id === comment.user_id);
        console.log('Comment user_id:', comment.user_id, 'Profile found:', profile);
        return {
          id: comment.id,
          achievement_id: comment.achievement_id,
          user_id: comment.user_id,
          content: comment.content,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          author_name: profile?.full_name || 'Unknown',
          author_picture: profile?.profile_picture_url
        };
      });
      
      setComments(transformedData);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to comment.",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "Error",
        description: "Please enter a comment.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Insert comment without foreign key query
      const { data, error } = await supabase
        .from('achievement_comments')
        .insert({
          achievement_id: achievementId,
          user_id: user.id,
          content: newComment.trim()
        })
        .select('*')
        .single();

      if (error) throw error;

      // Fetch user profile separately
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, profile_picture_url')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      // Add the new comment to the list
      const newCommentData = {
        id: data.id,
        achievement_id: data.achievement_id,
        user_id: data.user_id,
        content: data.content,
        created_at: data.created_at,
        updated_at: data.updated_at,
        author_name: profileData?.full_name || 'Unknown',
        author_picture: profileData?.profile_picture_url
      };

      setComments(prev => [...prev, newCommentData]);
      setNewComment("");
      onCommentAdded?.();

      toast({
        title: "Success",
        description: "Comment added successfully.",
      });
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter a comment.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('achievement_comments')
        .update({ 
          content: editContent.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, content: editContent.trim(), updated_at: new Date().toISOString() }
          : comment
      ));

      setEditingComment(null);
      setEditContent("");

      toast({
        title: "Success",
        description: "Comment updated successfully.",
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({
        title: "Error",
        description: "Failed to update comment.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('achievement_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => prev.filter(comment => comment.id !== commentId));

      toast({
        title: "Success",
        description: "Comment deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment.",
        variant: "destructive",
      });
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditContent("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editingComment) {
        handleEditComment(editingComment);
      } else {
        handleSubmitComment();
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Comment Input - Fixed at top */}
      {user && (
        <div className="p-4 border-b bg-white dark:bg-slate-800">
          <div className="flex space-x-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback>
                {user.user_metadata?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                ref={textareaRef}
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={handleKeyPress}
                className="min-h-[60px] resize-none"
                disabled={isSubmitting}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmitting}
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments List - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={comment.author_picture} />
                  <AvatarFallback>
                    {comment.author_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-sm">{comment.author_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), 'MMM dd, yyyy HH:mm')}
                    </span>
                    {comment.updated_at !== comment.created_at && (
                      <span className="text-xs text-muted-foreground">(edited)</span>
                    )}
                  </div>
                  
                  {editingComment === comment.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="min-h-[60px] resize-none"
                        autoFocus
                      />
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleEditComment(comment.id)}
                          size="sm"
                          disabled={!editContent.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          onClick={cancelEditing}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {comment.content}
                      </p>
                      
                      {user?.id === comment.user_id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-2">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => startEditing(comment)}>
                              <Edit3 className="h-3 w-3 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
