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
import { Plus, Upload, Download, ThumbsUp, ThumbsDown, MessageCircle, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";

interface Note {
  id: string;
  title: string;
  description: string;
  file_url: string;
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
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    file: null as File | null,
    fileType: "pdf"
  });

  useEffect(() => {
    fetchNotes();
  }, [unitId]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('uploads')
        .select(`
          *,
          profiles(
            full_name,
            profile_picture_url
          ),
          upload_reactions(
            user_id,
            reaction_type
          ),
          comments(
            id,
            content,
            created_at,
            commented_by,
            profiles(
              full_name,
              profile_picture_url
            )
          )
        `)
        .eq('unit_id', unitId)
        .eq('upload_type', 'note')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes((data || []) as unknown as Note[]);
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
          file_type: formData.file ? formData.fileType : null,
          upload_type: 'note',
          uploaded_by: user?.id
        });

      if (insertError) throw insertError;

      // Award points for uploading
      await supabase.rpc('update_user_points', {
        user_uuid: user?.id,
        points_change: 10
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
      const pointsChange = reactionType === 'like' ? 2 : -1;
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
        points_change: 3
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

  const canDelete = (note: Note) => {
    return note.uploaded_by === user?.id || 
           ['lecturer', 'admin', 'super_admin'].includes(profile?.role);
  };

  const getUserReaction = (note: Note) => {
    return note.upload_reactions.find(r => r.user_id === user?.id)?.reaction_type;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Notes</CardTitle>
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
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      file: e.target.files?.[0] || null 
                    })}
                  />
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
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notes.map((note) => {
              const userReaction = getUserReaction(note);
              return (
                <Card key={note.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={note.profiles.profile_picture_url} />
                          <AvatarFallback>
                            {note.profiles.full_name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold">{note.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            by {note.profiles.full_name} • {format(new Date(note.created_at), 'MMM dd, yyyy')}
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
                  <CardContent>
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
                    
                    <div className="flex items-center gap-4 mb-4">
                      <Button
                        variant={userReaction === 'like' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleReaction(note.id, 'like')}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {note.likes_count}
                      </Button>
                      <Button
                        variant={userReaction === 'dislike' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleReaction(note.id, 'dislike')}
                      >
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        {note.dislikes_count}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {note.comments.length} Comments
                      </Button>
                    </div>

                    {expandedNote === note.id && (
                      <div className="border-t pt-4">
                        <div className="space-y-3 mb-4">
                          {note.comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={comment.profiles.profile_picture_url} />
                                <AvatarFallback>
                                  {comment.profiles.full_name.split(' ').map((n: string) => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="bg-muted p-3 rounded-lg">
                                  <p className="text-sm">{comment.content}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {comment.profiles.full_name} • {format(new Date(comment.created_at), 'MMM dd, yyyy')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment(note.id)}
                          />
                          <Button onClick={() => handleAddComment(note.id)}>
                            Comment
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
        </CardContent>
      </Card>
    </div>
  );
}
