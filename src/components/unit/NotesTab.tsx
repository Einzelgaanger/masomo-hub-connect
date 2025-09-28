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
import { Plus, Upload, Download, Heart, HeartOff, MessageSquare, Trash2, Eye, FileText, Link, ThumbsDown } from "lucide-react";
import { format } from "date-fns";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Note {
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

interface NotesTabProps {
  unitId: string;
  profile: any;
}

export function NotesTab({ unitId, profile }: NotesTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ noteId: string; comment: any } | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<{ comment: any; noteId: string } | null>(null);
  const [showReactionDialog, setShowReactionDialog] = useState<{ noteId: string; x: number; y: number } | null>(null);
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
    fetchNotes();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [unitId]);

  const fetchNotes = async () => {
    try {
      // Fetch uploads without foreign key relationships
      const { data: uploadsData, error: uploadsError } = await supabase
        .from('uploads')
        .select('*')
        .eq('unit_id', unitId)
        .eq('upload_type', 'note')
        .order('created_at', { ascending: false });

      if (uploadsError) throw uploadsError;

      if (!uploadsData || uploadsData.length === 0) {
        setNotes([]);
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
      const notesWithData = uploadsData.map(upload => {
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

      setNotes(notesWithData as unknown as Note[]);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: "Error",
        description: "Failed to load notes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!unitId) return;

    console.log('Setting up Notes real-time subscription for unit:', unitId);

    const channel = supabase
      .channel(`notes-comments-${unitId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments'
        },
        (payload) => {
          console.log('New comment received via real-time:', payload.new);
          // Check if this comment is for one of our notes
          const isOurNote = notes.some(note => note.id === payload.new.upload_id);
          if (isOurNote && payload.new.commented_by !== user?.id) {
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
          // Check if this comment deletion is for one of our notes
          const isOurNote = notes.some(note => note.id === payload.old.upload_id);
          if (isOurNote) {
            setNotes(prev => prev.map(note => 
              note.id === payload.old.upload_id 
                ? { ...note, comments: note.comments.filter((c: any) => c.id !== payload.old.id) }
                : note
            ));
          }
        }
      )
      .subscribe((status) => {
        console.log('Notes subscription status:', status);
      });

    return () => {
      console.log('Cleaning up Notes real-time subscription');
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

      setNotes(prev => prev.map(note => 
        note.id === data.upload_id 
          ? { ...note, comments: [...note.comments, data] }
          : note
      ));
    } catch (error) {
      console.error('Error fetching new comment:', error);
    }
  };

  const handleFileUpload = async () => {
    try {
      if (!formData.title || !formData.description) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);
      let fileUrl = "";

      // Upload file if provided
      if (formData.file) {
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

        fileUrl = urlData.publicUrl;
      }

      // Create upload record
      const { error: insertError } = await supabase
        .from('uploads')
        .insert({
          unit_id: unitId,
          title: formData.title,
          description: formData.description,
          file_url: fileUrl || null,
          link_url: formData.link || null,
          file_type: formData.file ? formData.fileType : null,
          upload_type: 'note',
          uploaded_by: user?.id
        });

      if (insertError) throw insertError;

      // Award points for uploading
      await supabase.rpc('update_user_points', {
        user_uuid: user?.id,
        points_change: 5
      });

      toast({
        title: "Success",
        description: "Note uploaded successfully! You earned 10 points.",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchNotes();
    } catch (error) {
      console.error('Error uploading note:', error);
      toast({
        title: "Error",
        description: "Failed to upload note.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleReaction = async (noteId: string, reactionType: 'like' | 'dislike') => {
    try {
      // Check if user already reacted
      const existingReaction = notes
        .find(n => n.id === noteId)
        ?.upload_reactions.find(r => r.user_id === user?.id);

      if (existingReaction) {
        if (existingReaction.reaction_type === reactionType) {
          // Remove reaction
          await supabase
            .from('upload_reactions')
            .delete()
            .eq('upload_id', noteId)
            .eq('user_id', user?.id);
        } else {
          // Update reaction
          await supabase
            .from('upload_reactions')
            .update({ reaction_type: reactionType })
            .eq('upload_id', noteId)
            .eq('user_id', user?.id);
        }
      } else {
        // Add new reaction
        await supabase
          .from('upload_reactions')
          .insert({
            upload_id: noteId,
            user_id: user?.id,
            reaction_type: reactionType
          });
      }

      // Update like/dislike counts
      const pointsChange = reactionType === 'like' ? 1 : -1;
      await supabase.rpc('update_user_points', {
        user_uuid: user?.id,
        points_change: pointsChange
      });

      fetchNotes();
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const handleAddComment = async (noteId: string) => {
    try {
      if (!newComment.trim()) return;

      const { error } = await supabase
        .from('comments')
        .insert({
          upload_id: noteId,
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
      fetchNotes();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const { error } = await supabase
        .from('uploads')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Note deleted successfully.",
      });

      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      file: null,
      fileType: "pdf"
    });
  };

  // Swipe to reply functionality for comments
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent, comment: any, noteId: string) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchEnd = (e: React.TouchEvent, comment: any, noteId: string) => {
    if (!touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isVerticalSwipe = Math.abs(distanceY) > Math.abs(distanceX);

    if ((isLeftSwipe || isRightSwipe) && !isVerticalSwipe) {
      setReplyingTo({ noteId, comment });
    }
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  // Long press to delete comment functionality
  const handleLongPress = (comment: any, noteId: string) => {
    if (comment.user_id === user?.id) {
      setShowDeleteDialog({ comment, noteId });
    }
  };

  const handleLongPressStart = (e: React.TouchEvent, comment: any, noteId: string) => {
    e.preventDefault();
    if (comment.user_id === user?.id) {
      const timer = setTimeout(() => {
        handleLongPress(comment, noteId);
      }, 500); // 500ms long press
      setLongPressTimer(timer);
    }
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Long press for note reactions
  const handleNoteLongPress = (e: React.MouseEvent | React.TouchEvent, noteId: string) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top - 10;
    setShowReactionDialog({ noteId, x, y });
  };

  const handleNoteLongPressStart = (e: React.TouchEvent, noteId: string) => {
    e.preventDefault();
    const timer = setTimeout(() => {
      handleNoteLongPress(e, noteId);
    }, 500); // 500ms long press
    setLongPressTimer(timer);
  };

  const handleNoteLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleReactionFromDialog = async (noteId: string, reactionType: 'like' | 'dislike') => {
    await handleReaction(noteId, reactionType);
    setShowReactionDialog(null);
  };

  const cancelReactionDialog = () => {
    setShowReactionDialog(null);
  };

  const deleteComment = async (commentId: string, noteId: string) => {
    try {
      // Remove from UI immediately (optimistic update)
      setNotes(prev => prev.map(note => 
        note.id === noteId 
          ? { ...note, comments: note.comments.filter((c: any) => c.id !== commentId) }
          : note
      ));
      
      // Delete from database
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted",
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      
      // Refresh notes to restore if deletion failed
      fetchNotes();
      
      toast({
        title: "Delete failed",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(null);
    }
  };

  const canDelete = (note: Note) => {
    return note.uploaded_by === user?.id || 
           ['lecturer', 'admin', 'super_admin'].includes(profile?.role);
  };

  const getUserReaction = (note: Note) => {
    return note.upload_reactions.find(r => r.user_id === user?.id)?.reaction_type;
  };

  const getLikesCount = (note: Note) => {
    return note.upload_reactions.filter(r => r.reaction_type === 'like').length;
  };

  const getDislikesCount = (note: Note) => {
    return note.upload_reactions.filter(r => r.reaction_type === 'dislike').length;
  };

  if (loading) {
    return <LoadingSpinner message="Loading notes..." variant="minimal" size="sm" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center justify-between">
        <h2 className="text-2xl font-bold">Notes</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Upload Note
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload New Note</DialogTitle>
                <DialogDescription>
                  Share your notes with your classmates. You'll earn 10 points for uploading!
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter note title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your notes"
                    rows={4}
                  />
                </div>
                
                <div>
                  <Label htmlFor="file">File (Optional)</Label>
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
                    placeholder="https://example.com/note-resources"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Share a link to additional resources, online notes, or related materials
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleFileUpload} disabled={isUploading}>
                  {isUploading ? "Uploading..." : "Upload Note"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
      </div>

      <div className="space-y-4">
            {notes.map((note) => {
              const userReaction = getUserReaction(note);
              return (
                <Card key={note.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={note.profiles?.profile_picture_url} />
                          <AvatarFallback>
                            {note.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold">{note.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            by {note.profiles?.full_name || 'Unknown User'} • {format(new Date(note.created_at), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-sm mt-2">{note.description}</p>
                        </div>
                      </div>
                      {canDelete(note) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent 
                    onDoubleClick={() => handleReaction(note.id, 'like')}
                    onMouseDown={(e) => handleNoteLongPress(e, note.id)}
                    onTouchStart={(e) => {
                      handleNoteLongPressStart(e, note.id);
                    }}
                    onTouchEnd={handleNoteLongPressEnd}
                    onTouchCancel={handleNoteLongPressEnd}
                  >
                    {note.file_url && (
                      <div className="mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(note.file_url, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download File
                        </Button>
                      </div>
                    )}

                    {note.link_url && (
                      <div className="mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(note.link_url, '_blank')}
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
                        onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)}
                        className="h-7 px-2 text-xs"
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        {note.comments.length}
                      </Button>
                      {/* Reaction Badges */}
                      {getLikesCount(note) > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                          <span>{getLikesCount(note)}</span>
                        </div>
                      )}
                      {getDislikesCount(note) > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ThumbsDown className="h-3 w-3 fill-gray-500 text-gray-500" />
                          <span>{getDislikesCount(note)}</span>
                        </div>
                      )}
                    </div>

                    {expandedNote === note.id && (
                      <div className="border-t pt-4">
                        <div className="max-h-64 overflow-y-auto space-y-3 mb-4 pr-2">
                          {note.comments.map((comment) => (
                            <div key={comment.id} className="flex gap-2 sm:gap-3">
                              <Avatar className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0">
                                <AvatarImage src={comment.profiles?.profile_picture_url} />
                                <AvatarFallback className="text-xs">
                                  {comment.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div 
                                  className="bg-muted p-2 sm:p-3 rounded-lg relative"
                                  onTouchStart={(e) => {
                                    onTouchStart(e, comment, note.id);
                                    handleLongPressStart(e, comment, note.id);
                                  }}
                                  onTouchMove={(e) => {
                                    onTouchMove(e);
                                    handleLongPressEnd();
                                  }}
                                  onTouchEnd={(e) => {
                                    onTouchEnd(e, comment, note.id);
                                    handleLongPressEnd();
                                  }}
                                >
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
                        
                        {/* Reply Preview */}
                        {replyingTo && replyingTo.noteId === note.id && (
                          <div className="mb-3 p-2 bg-muted/50 rounded-lg">
                            <div className="flex items-start gap-2">
                              <div className="flex-1">
                                <p className="text-xs text-muted-foreground">Replying to {replyingTo.comment.profiles.full_name}</p>
                                <p className="text-sm truncate">{replyingTo.comment.content}</p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={cancelReply}
                                className="h-6 w-6 p-0"
                              >
                                ×
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-1 sm:gap-2">
                          <Input
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment(note.id)}
                            className="text-sm h-8 sm:h-10"
                          />
                          <Button 
                            onClick={() => handleAddComment(note.id)}
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
            
            {notes.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
                <p className="text-muted-foreground">
                  Be the first to share notes for this unit!
                </p>
              </div>
            )}
          </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Delete Comment</h3>
            <p className="text-muted-foreground mb-4">
              Are you sure you want to delete this comment? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteComment(showDeleteDialog.comment.id, showDeleteDialog.noteId)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

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
            onClick={() => handleReactionFromDialog(showReactionDialog.noteId, 'like')}
            className="flex items-center gap-1"
          >
            <Heart className="h-4 w-4 text-red-500" />
            Like
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleReactionFromDialog(showReactionDialog.noteId, 'dislike')}
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
