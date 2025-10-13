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
  Reply,
  Loader2,
  MessageCircle,
  ChevronUp,
  Heart,
  ThumbsUp
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
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [newlyAddedCommentId, setNewlyAddedCommentId] = useState<string | null>(null);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [justAddedComment, setJustAddedComment] = useState(false);
  const [lastCommentTime, setLastCommentTime] = useState<number>(0);
  const [commentLikes, setCommentLikes] = useState<Record<string, { count: number; liked: boolean }>>({});
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const commentsScrollRef = useRef<HTMLDivElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    // Debounce the fetch to prevent rapid successive calls
    fetchTimeoutRef.current = setTimeout(() => {
      fetchComments();
    }, 100);
    
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [achievementId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  // Auto-resize textarea
  const autoResizeTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  // Handle scroll to show/hide scroll to top button
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setShowScrollToTop(scrollTop > 200);
  };

  // Scroll to top function
  const scrollToTop = () => {
    if (commentsScrollRef.current) {
      commentsScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Auto-scroll to bottom when new comment is added
  const scrollToBottom = () => {
    if (commentsScrollRef.current) {
      const element = commentsScrollRef.current;
      console.log('Scrolling to bottom:', element.scrollHeight, element.scrollTop, element.clientHeight);
      
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        // Force scroll to absolute bottom
        element.scrollTop = element.scrollHeight;
        console.log('First scroll attempt:', element.scrollHeight, element.scrollTop);
        
        // Try again after a frame
        requestAnimationFrame(() => {
          element.scrollTop = element.scrollHeight;
          console.log('Second scroll attempt:', element.scrollHeight, element.scrollTop);
        });
      });
      
      // Additional attempts with delays
      setTimeout(() => {
        element.scrollTop = element.scrollHeight;
        console.log('Delayed scroll attempt:', element.scrollHeight, element.scrollTop);
      }, 100);
      
      setTimeout(() => {
        element.scrollTop = element.scrollHeight;
        console.log('Final scroll attempt:', element.scrollHeight, element.scrollTop);
      }, 300);
    }
  };

  const fetchComments = async () => {
    // Prevent multiple simultaneous fetches
    if (isFetching) {
      console.log('Already fetching comments, skipping...');
      return;
    }

    // Don't fetch if we just added a comment (to prevent overriding the new comment)
    const timeSinceLastComment = Date.now() - lastCommentTime;
    if (justAddedComment || timeSinceLastComment < 10000) { // 10 seconds
      console.log('Just added comment, skipping fetch to prevent override...');
      return;
    }

    try {
      setIsFetching(true);
      setLoading(true);
      
      // Fetch comments and profiles separately to avoid foreign key issues
      const { data: commentsData, error: commentsError } = await supabase
        .from('achievement_comments')
        .select('*')
        .eq('achievement_id', achievementId)
        .order('created_at', { ascending: true })
        .limit(limit || 100); // Increase limit to 100 to show more comments

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
      setHasMoreComments(transformedData.length >= (limit || 100));
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsFetching(false);
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

    const commentText = newComment.trim();
    setIsSubmitting(true);
    
    // Check for duplicate comments
    const isDuplicate = comments.some(comment => 
      comment.content === commentText && 
      comment.user_id === user.id &&
      Date.now() - new Date(comment.created_at).getTime() < 5000 // Within 5 seconds
    );

    if (isDuplicate) {
      toast({
        title: "Duplicate Comment",
        description: "You just posted a similar comment.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Clear the input immediately
    setNewComment("");

    try {
      // Insert comment to database first
      const { data, error } = await supabase
        .from('achievement_comments')
        .insert({
          achievement_id: achievementId,
          user_id: user.id,
          content: commentText
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

      // Add the real comment immediately
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

      // Check if comment already exists to prevent duplicates
      setComments(prev => {
        const exists = prev.some(comment => comment.id === data.id);
        if (exists) {
          console.log('Comment already exists, not adding duplicate');
          return prev;
        }
        return [...prev, newCommentData];
      });
      
      // Set states immediately
      setNewlyAddedCommentId(data.id);
      setJustAddedComment(true);
      setLastCommentTime(Date.now());
      onCommentAdded?.();
      
      // Force a re-render to ensure the comment is visible
      setTimeout(() => {
        setComments(prev => [...prev]);
      }, 10);

      // No need to scroll - newest comments appear at the top automatically

      // Remove highlight after 3 seconds
      setTimeout(() => {
        setNewlyAddedCommentId(null);
      }, 3000);

      // Reset the justAddedComment flag after 5 seconds
      setTimeout(() => {
        setJustAddedComment(false);
      }, 5000);

    } catch (error) {
      console.error('Error submitting comment:', error);
      
      // Restore the comment text on error
      setNewComment(commentText);
      
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
    
    // Auto-resize edit textarea after a short delay
    setTimeout(() => {
      if (editTextareaRef.current) {
        autoResizeTextarea(editTextareaRef.current);
      }
    }, 100);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditContent("");
  };

  const handleCommentLike = async (commentId: string) => {
    if (!user) return;

    try {
      const currentLike = commentLikes[commentId];
      const isLiked = currentLike?.liked || false;
      const newCount = isLiked ? (currentLike?.count || 1) - 1 : (currentLike?.count || 0) + 1;

      // Optimistic update
      setCommentLikes(prev => ({
        ...prev,
        [commentId]: { count: newCount, liked: !isLiked }
      }));

      // TODO: Implement actual like/unlike API call here
      // For now, just the optimistic update
    } catch (error) {
      console.error('Error liking comment:', error);
      // Revert optimistic update on error
      setCommentLikes(prev => ({
        ...prev,
        [commentId]: { count: currentLike?.count || 0, liked: currentLike?.liked || false }
      }));
    }
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
    <div className="flex flex-col h-full max-h-[600px] bg-white dark:bg-slate-800 rounded-lg border">
      {/* Comment Input - Fixed at top */}
      {user && (
        <div className="p-2 border-b bg-white dark:bg-slate-800 rounded-t-lg">
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
                placeholder="Write a comment... (Press Enter to send, Shift+Enter for new line)"
                value={newComment}
                onChange={(e) => {
                  setNewComment(e.target.value);
                  autoResizeTextarea(e.target);
                }}
                onKeyPress={handleKeyPress}
                className="min-h-[60px] max-h-[120px] resize-none transition-all duration-200"
                disabled={isSubmitting}
                style={{ height: '60px' }}
              />
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">
                  {newComment.length}/500
                </div>
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmitting || newComment.length > 500}
                  size="sm"
                  className="h-7 w-7 p-0 transition-all duration-200"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments List - Enhanced Scrollable */}
      <div className="flex-1 relative">
        <div 
          ref={commentsScrollRef}
          className="h-full max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
          onScroll={handleScroll}
        >
          <div className="p-2 pb-16">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Loading comments...</span>
              </div>
            ) : comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No comments yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to share your thoughts on this achievement!
                </p>
                {!user && (
                  <p className="text-sm text-muted-foreground">
                    Sign in to leave a comment
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {comments.slice().reverse().map((comment) => (
                  <div 
                    key={comment.id} 
                    className={`comment-item flex space-x-2 group hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-md p-1 -m-1 transition-all duration-500 border-l-2 ${
                      newlyAddedCommentId === comment.id 
                        ? 'bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 shadow-md' 
                        : comment.id.endsWith('1') || comment.id.endsWith('3') || comment.id.endsWith('5')
                        ? 'border-blue-200 dark:border-blue-800'
                        : comment.id.endsWith('2') || comment.id.endsWith('4') || comment.id.endsWith('6')
                        ? 'border-purple-200 dark:border-purple-800'
                        : 'border-orange-200 dark:border-orange-800'
                    }`}
                  >
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      <AvatarImage src={comment.author_picture} />
                      <AvatarFallback className="text-xs">
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
                          <span className="text-xs text-muted-foreground bg-slate-100 dark:bg-slate-600 px-1 rounded">
                            edited
                          </span>
                        )}
                      </div>
                      
                      {editingComment === comment.id ? (
                        <div className="space-y-2">
                          <Textarea
                            ref={editTextareaRef}
                            value={editContent}
                            onChange={(e) => {
                              setEditContent(e.target.value);
                              autoResizeTextarea(e.target);
                            }}
                            onKeyPress={handleKeyPress}
                            className="min-h-[60px] max-h-[120px] resize-none transition-all duration-200"
                            autoFocus
                            style={{ height: '60px' }}
                          />
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handleEditComment(comment.id)}
                              size="sm"
                              disabled={!editContent.trim() || editContent.length > 500}
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
                        <div className="flex items-start justify-between w-full">
                          <div className="flex-1 min-w-0 mr-2">
                            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                              {comment.content}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            {/* Like Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCommentLike(comment.id)}
                                className={`h-5 px-1 text-xs transition-all duration-200 ${
                                  commentLikes[comment.id]?.liked 
                                    ? 'text-red-500 hover:text-red-600' 
                                    : 'text-gray-500 hover:text-red-500'
                                }`}
                              >
                                <Heart className={`h-3 w-3 ${(commentLikes[comment.id]?.count || 0) > 0 ? 'mr-1' : ''} ${
                                  commentLikes[comment.id]?.liked ? 'fill-current' : ''
                                }`} />
                                {(commentLikes[comment.id]?.count || 0) > 0 && (commentLikes[comment.id]?.count || 0)}
                              </Button>
                            
                            {user?.id === comment.user_id && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
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
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Bottom spacer to ensure last comment is fully visible */}
                <div className="h-8"></div>
              </div>
            )}
            
            {/* Load More Button */}
            {hasMoreComments && (
              <div className="flex justify-center py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLoadingMore(true);
                    // Increase limit and refetch
                    fetchComments();
                    setLoadingMore(false);
                  }}
                  disabled={loadingMore}
                  className="text-xs"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More Comments'
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Scroll to Top Button */}
        {showScrollToTop && (
          <Button
            onClick={scrollToTop}
            size="sm"
            className="absolute bottom-4 right-4 h-8 w-8 p-0 rounded-full shadow-lg"
            variant="secondary"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Comments Count */}
      {comments.length > 0 && (
        <div className="px-2 py-1 border-t bg-slate-50 dark:bg-slate-700/50 text-xs text-muted-foreground">
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </div>
      )}
    </div>
  );
}
