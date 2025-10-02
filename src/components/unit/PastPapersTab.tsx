import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, Download, Heart, HeartOff, MessageSquare, Trash2, FileText, Link, ThumbsDown } from "lucide-react";
import { format } from "date-fns";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface PastPaper {
  id: string;
  title: string;
  description: string;
  file_url: string;
  link_url?: string;
  file_type: string;
  created_at: string;
  uploaded_by: string;
  likes_count: number;
  dislikes_count: number;
  profiles?: {
    full_name: string;
    profile_picture_url: string;
  };
  upload_reactions: Array<{
    user_id: string;
    reaction_type: string;
  }>;
  comments: Array<{
    id: string;
    content: string;
    created_at: string;
    commented_by: string;
    profiles?: {
      full_name: string;
      profile_picture_url: string;
    };
  }>;
}

interface PastPapersTabProps {
  unitId: string;
  classId: string;
  userRole: 'creator' | 'student';
}

export function PastPapersTab({ unitId, classId, userRole }: PastPapersTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pastPapers, setPastPapers] = useState<PastPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [expandedPaper, setExpandedPaper] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ paperId: string; comment: any } | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<{ comment: any; paperId: string } | null>(null);
  const [showReactionDialog, setShowReactionDialog] = useState<{ paperId: string; x: number; y: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    file: null as File | null,
    fileType: "pdf",
    link: ""
  });

  useEffect(() => {
    fetchPastPapers();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [unitId]);

  const fetchPastPapers = async () => {
    try {
      // Fetch uploads without foreign key relationships
      const { data: uploadsData, error: uploadsError } = await supabase
        .from('uploads')
        .select('*')
        .eq('unit_id', unitId)
        .eq('upload_type', 'past_paper')
        .order('created_at', { ascending: false });

      if (uploadsError) throw uploadsError;

      if (!uploadsData || uploadsData.length === 0) {
        setPastPapers([]);
        return;
      }

      // Fetch profiles for uploaders
      const uploaderIds = [...new Set(uploadsData.map(upload => upload.uploaded_by))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, profile_picture_url')
        .in('user_id', uploaderIds);

      // Fetch reactions for all uploads
      const uploadIds = uploadsData.map(upload => upload.id);
      const { data: reactionsData } = await supabase
        .from('upload_reactions')
        .select('upload_id, user_id, reaction_type')
        .in('upload_id', uploadIds);

      // Fetch comments for all uploads
      const { data: commentsData } = await supabase
        .from('comments')
        .select('id, upload_id, content, created_at, commented_by')
        .in('upload_id', uploadIds);

      // Get commenter profiles
      const commenterIds = commentsData ? [...new Set(commentsData.map(comment => comment.commented_by))] : [];
      const { data: commenterProfiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, profile_picture_url')
        .in('user_id', commenterIds);

      // Combine the data
      const pastPapersWithData = uploadsData.map(upload => {
        const profile = profilesData?.find(p => p.user_id === upload.uploaded_by);
        const reactions = reactionsData?.filter(r => r.upload_id === upload.id) || [];
        const comments = commentsData?.filter(c => c.upload_id === upload.id) || [];
        
        const commentsWithProfiles = comments.map(comment => ({
          ...comment,
          profiles: commenterProfiles?.find(p => p.user_id === comment.commented_by) || { full_name: 'Unknown User', profile_picture_url: null }
        }));

        return {
          ...upload,
          profiles: profile || { full_name: 'Unknown User', profile_picture_url: null },
          upload_reactions: reactions,
          comments: commentsWithProfiles
        };
      });

      setPastPapers(pastPapersWithData as unknown as PastPaper[]);
    } catch (error) {
      console.error('Error fetching past papers:', error);
      toast({
        title: "Error",
        description: "Failed to load past papers.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!unitId) return;

    console.log('Setting up Past Papers real-time subscription for unit:', unitId);

    const channel = supabase
      .channel(`past-papers-comments-${unitId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments'
        },
        (payload) => {
          console.log('New comment received via real-time:', payload.new);
          // Check if this comment is for one of our past papers
          const isOurPaper = pastPapers.some(paper => paper.id === payload.new.upload_id);
          if (isOurPaper && payload.new.commented_by !== user?.id) {
            fetchNewComment(payload.new.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments'
        },
        (payload) => {
          console.log('Comment deleted via real-time:', payload.old);
          // Check if this comment deletion is for one of our past papers
          const isOurPaper = pastPapers.some(paper => paper.id === payload.old.upload_id);
          if (isOurPaper) {
            setPastPapers(prev => prev.map(paper => 
              paper.id === payload.old.upload_id 
                ? { ...paper, comments: paper.comments.filter((c: any) => c.id !== payload.old.id) }
                : paper
            ));
          }
        }
      )
      .subscribe((status) => {
        console.log('Past Papers subscription status:', status);
      });

    return () => {
      console.log('Cleaning up Past Papers real-time subscription');
      supabase.removeChannel(channel);
    };
  };

  const fetchNewComment = async (commentId: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles(
            full_name,
            profile_picture_url
          )
        `)
        .eq('id', commentId)
        .single();

      if (error) throw error;

      setPastPapers(prev => prev.map(paper => 
        paper.id === data.upload_id 
          ? { ...paper, comments: [...paper.comments, data] }
          : paper
      ));
    } catch (error) {
      console.error('Error fetching new comment:', error);
    }
  };

  const handleFileUpload = async () => {
    try {
      if (!formData.title || !formData.description || !formData.file) {
        toast({
          title: "Error",
          description: "Please fill in all fields and select a file.",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);
      
      // Upload file
      const fileExt = formData.file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${unitId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, formData.file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      // Create upload record
      const { error: insertError } = await supabase
        .from('uploads')
        .insert({
          unit_id: unitId,
          title: formData.title,
          description: formData.description,
          file_url: urlData.publicUrl,
          link_url: formData.link || null,
          file_type: formData.fileType,
          upload_type: 'past_paper',
          uploaded_by: user?.id
        });

      if (insertError) throw insertError;

      // Award points for uploading
      await supabase.rpc('update_user_points', {
        user_uuid: user?.id,
        points_change: 7
      });

      toast({
        title: "Success",
        description: "Past paper uploaded successfully! You earned 15 points.",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchPastPapers();
    } catch (error) {
      console.error('Error uploading past paper:', error);
      toast({
        title: "Error",
        description: "Failed to upload past paper.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleReaction = async (paperId: string, reactionType: 'like' | 'dislike') => {
    try {
      // Check if user already reacted
      const existingReaction = pastPapers
        .find(p => p.id === paperId)
        ?.upload_reactions.find(r => r.user_id === user?.id);

      if (existingReaction) {
        if (existingReaction.reaction_type === reactionType) {
          // Remove reaction
          await supabase
            .from('upload_reactions')
            .delete()
            .eq('upload_id', paperId)
            .eq('user_id', user?.id);
        } else {
          // Update reaction
          await supabase
            .from('upload_reactions')
            .update({ reaction_type: reactionType })
            .eq('upload_id', paperId)
            .eq('user_id', user?.id);
        }
      } else {
        // Add new reaction
        await supabase
          .from('upload_reactions')
          .insert({
            upload_id: paperId,
            user_id: user?.id,
            reaction_type: reactionType
          });
      }

      // Update like/dislike counts and award points
      const pointsChange = reactionType === 'like' ? 1 : -1;
      await supabase.rpc('update_user_points', {
        user_uuid: user?.id,
        points_change: pointsChange
      });

      fetchPastPapers();
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const handleAddComment = async (paperId: string) => {
    try {
      if (!newComment.trim()) return;

      const { error } = await supabase
        .from('comments')
        .insert({
          upload_id: paperId,
          content: newComment.trim(),
          commented_by: user?.id
        });

      if (error) throw error;

      // Award points for commenting
      await supabase.rpc('update_user_points', {
        user_uuid: user?.id,
        points_change: 2
      });

      setNewComment("");
      fetchPastPapers();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDeletePaper = async (paperId: string) => {
    if (!confirm("Are you sure you want to delete this past paper?")) return;

    try {
      const { error } = await supabase
        .from('uploads')
        .delete()
        .eq('id', paperId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Past paper deleted successfully.",
      });

      fetchPastPapers();
    } catch (error) {
      console.error('Error deleting past paper:', error);
      toast({
        title: "Error",
        description: "Failed to delete past paper.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      file: null,
      fileType: "pdf",
      link: ""
    });
  };

  // Long press for paper reactions
  const handlePaperLongPress = (e: React.MouseEvent | React.TouchEvent, paperId: string) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top - 10;
    setShowReactionDialog({ paperId, x, y });
  };

  const handlePaperLongPressStart = (e: React.TouchEvent, paperId: string) => {
    e.preventDefault();
    const timer = setTimeout(() => {
      handlePaperLongPress(e, paperId);
    }, 500); // 500ms long press
    setLongPressTimer(timer);
  };

  const handlePaperLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleReactionFromDialog = async (paperId: string, reactionType: 'like' | 'dislike') => {
    await handleReaction(paperId, reactionType);
    setShowReactionDialog(null);
  };

  const cancelReactionDialog = () => {
    setShowReactionDialog(null);
  };

  const canDelete = (paper: PastPaper) => {
    return paper.uploaded_by === user?.id || 
           ['lecturer', 'admin', 'super_admin'].includes(profile?.role);
  };

  const getUserReaction = (paper: PastPaper) => {
    return paper.upload_reactions.find(r => r.user_id === user?.id)?.reaction_type;
  };

  const getLikesCount = (paper: PastPaper) => {
    return paper.upload_reactions.filter(r => r.reaction_type === 'like').length;
  };

  const getDislikesCount = (paper: PastPaper) => {
    return paper.upload_reactions.filter(r => r.reaction_type === 'dislike').length;
  };

  if (loading) {
    return <LoadingSpinner message="Loading past papers..." variant="minimal" size="sm" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center justify-between">
        <h2 className="text-2xl font-bold">Past Papers</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Upload Past Paper
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload New Past Paper</DialogTitle>
                <DialogDescription>
                  Share past exam papers with your classmates. You'll earn 15 points for uploading!
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., 2023 Midterm Exam"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the past paper (year, semester, etc.)"
                    rows={4}
                  />
                </div>
                
                <div>
                  <Label htmlFor="file">Past Paper File *</Label>
                  <Input
                    id="file"
                    type="file"
                    accept="*"
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      file: e.target.files?.[0] || null 
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="link">Link (Optional)</Label>
                  <Input
                    id="link"
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="https://example.com/past-paper-resources"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Share a link to additional past paper resources or solutions
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleFileUpload} disabled={isUploading}>
                  {isUploading ? "Uploading..." : "Upload Past Paper"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
      </div>

      <div className="space-y-4">
            {pastPapers.map((paper) => {
              const userReaction = getUserReaction(paper);
              return (
                <Card key={paper.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={paper.profiles?.profile_picture_url} />
                          <AvatarFallback>
                            {paper.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold">{paper.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            by {paper.profiles?.full_name || 'Unknown User'} • {format(new Date(paper.created_at), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-sm mt-2">{paper.description}</p>
                        </div>
                      </div>
                      {canDelete(paper) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePaper(paper.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent 
                    onDoubleClick={() => handleReaction(paper.id, 'like')}
                    onMouseDown={(e) => {
                      // Only trigger if not clicking on a button
                      if (!(e.target as HTMLElement).closest('button')) {
                        handlePaperLongPress(e, paper.id);
                      }
                    }}
                    onTouchStart={(e) => {
                      // Only trigger if not touching a button
                      if (!(e.target as HTMLElement).closest('button')) {
                        handlePaperLongPressStart(e, paper.id);
                      }
                    }}
                    onTouchEnd={handlePaperLongPressEnd}
                    onTouchCancel={handlePaperLongPressEnd}
                  >
                    {paper.file_url && (
                      <div className="mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(paper.file_url, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Past Paper
                        </Button>
                      </div>
                    )}

                    {paper.link_url && (
                      <div className="mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(paper.link_url, '_blank')}
                        >
                          <Link className="h-4 w-4 mr-2" />
                          Open Link
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 sm:gap-3 mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedPaper(expandedPaper === paper.id ? null : paper.id);
                        }}
                        className="h-7 px-2 text-xs"
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        {paper.comments.length}
                      </Button>
                      
                      {/* Like Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReaction(paper.id, 'like');
                        }}
                        className={`h-7 px-2 text-xs ${
                          getUserReaction(paper) === 'like' 
                            ? 'bg-red-50 border-red-200 text-red-600' 
                            : 'hover:bg-red-50 hover:border-red-200'
                        }`}
                      >
                        <Heart className={`h-3 w-3 mr-1 ${
                          getUserReaction(paper) === 'like' ? 'fill-red-500 text-red-500' : ''
                        }`} />
                        {getLikesCount(paper)}
                      </Button>
                      
                      {/* Dislike Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReaction(paper.id, 'dislike');
                        }}
                        className={`h-7 px-2 text-xs ${
                          getUserReaction(paper) === 'dislike' 
                            ? 'bg-gray-50 border-gray-200 text-gray-600' 
                            : 'hover:bg-gray-50 hover:border-gray-200'
                        }`}
                      >
                        <ThumbsDown className={`h-3 w-3 mr-1 ${
                          getUserReaction(paper) === 'dislike' ? 'fill-gray-500 text-gray-500' : ''
                        }`} />
                        {getDislikesCount(paper)}
                      </Button>
                    </div>

                    {expandedPaper === paper.id && (
                      <div className="border-t pt-4">
                        <div className="max-h-64 overflow-y-auto space-y-3 mb-4 pr-2">
                          {paper.comments.map((comment) => (
                            <div key={comment.id} className="flex gap-2 sm:gap-3">
                              <Avatar className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0">
                                <AvatarImage src={comment.profiles?.profile_picture_url} />
                                <AvatarFallback className="text-xs">
                                  {comment.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="bg-muted p-2 sm:p-3 rounded-lg relative">
                                  <p className="text-xs sm:text-sm break-words line-clamp-3">{comment.content}</p>
                                  <p className="text-xs text-muted-foreground mt-1 truncate">
                                    {comment.profiles.full_name} • {format(new Date(comment.created_at), 'MMM dd, yyyy')}
                                  </p>
                                  {/* Like Badge */}
                                  {comment.likes_count > 0 && (
                                    <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
                                      <Heart className="h-2 w-2 fill-current" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex gap-1 sm:gap-2">
                          <Input
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment(paper.id)}
                            className="text-sm h-8 sm:h-10"
                          />
                          <Button 
                            onClick={() => handleAddComment(paper.id)}
                            className="h-8 sm:h-10 px-3 text-xs sm:text-sm"
                          >
                            <span className="hidden sm:inline">Comment</span>
                            <span className="sm:hidden">+</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            
            {pastPapers.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No past papers yet</h3>
                <p className="text-muted-foreground">
                  Be the first to share past papers for this unit!
                </p>
              </div>
            )}
          </div>

      {/* Reaction Dialog */}
      {showReactionDialog && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-2"
          style={{
            left: `${showReactionDialog.x - 80}px`,
            top: `${showReactionDialog.y}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleReactionFromDialog(showReactionDialog.paperId, 'like')}
            className="flex items-center gap-1"
          >
            <Heart className="h-4 w-4 text-red-500" />
            Like
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleReactionFromDialog(showReactionDialog.paperId, 'dislike')}
            className="flex items-center gap-1"
          >
            <ThumbsDown className="h-4 w-4 text-gray-500" />
            Dislike
          </Button>
        </div>
      )}

      {/* Backdrop to close reaction dialog */}
      {showReactionDialog && (
        <div
          className="fixed inset-0 z-40"
          onClick={cancelReactionDialog}
        />
      )}
    </div>
  );
}
