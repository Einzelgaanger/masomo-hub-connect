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
import { Plus, Upload, Download, Trash2, Calendar, CheckCircle, Clock } from "lucide-react";
import { format, formatDistanceToNow, isAfter } from "date-fns";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Assignment {
  id: string;
  title: string;
  description: string;
  file_url: string;
  deadline: string;
  created_at: string;
  created_by: string;
  profiles?: {
    full_name: string;
    profile_picture_url: string;
  };
  assignment_completions: Array<{
    user_id: string;
    completed_at: string;
  }>;
}

interface AssignmentsTabProps {
  unitId: string;
  profile: any;
}

export function AssignmentsTab({ unitId, profile }: AssignmentsTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    deadline: "",
    file: null as File | null
  });

  useEffect(() => {
    fetchAssignments();
  }, [unitId]);

  const fetchAssignments = async () => {
    try {
      // Fetch assignments without foreign key relationships
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .eq('unit_id', unitId)
        .order('deadline', { ascending: true });

      if (assignmentsError) throw assignmentsError;

      if (!assignmentsData || assignmentsData.length === 0) {
        setAssignments([]);
        return;
      }

      // Fetch profiles for assignment creators
      const creatorIds = [...new Set(assignmentsData.map(assignment => assignment.created_by))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, profile_picture_url')
        .in('user_id', creatorIds);

      // Fetch assignment completions for all assignments
      const assignmentIds = assignmentsData.map(assignment => assignment.id);
      const { data: completionsData } = await supabase
        .from('assignment_completions')
        .select('assignment_id, user_id, completed_at')
        .in('assignment_id', assignmentIds);

      // Combine the data
      const assignmentsWithData = assignmentsData.map(assignment => {
        const profile = profilesData?.find(p => p.user_id === assignment.created_by);
        const completions = completionsData?.filter(c => c.assignment_id === assignment.id) || [];

        return {
          ...assignment,
          profiles: profile,
          assignment_completions: completions
        };
      });

      setAssignments(assignmentsWithData as unknown as Assignment[]);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast({
        title: "Error",
        description: "Failed to load assignments.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    try {
      if (!formData.title || !formData.description || !formData.deadline) {
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

      // Create assignment
      const { error: insertError } = await supabase
        .from('assignments')
        .insert({
          unit_id: unitId,
          title: formData.title,
          description: formData.description,
          file_url: fileUrl || null,
          deadline: formData.deadline,
          created_by: user?.id
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Assignment shared successfully! You earned 10 points.",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchAssignments();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: "Error",
        description: "Failed to share assignment.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleMarkComplete = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('assignment_completions')
        .upsert({
          assignment_id: assignmentId,
          user_id: user?.id,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      // Award points for completing assignment
      await supabase.rpc('update_user_points', {
        user_uuid: user?.id,
        points_change: 10
      });

      toast({
        title: "Success",
        description: "Assignment marked as complete! You earned 20 points.",
      });

      fetchAssignments();
    } catch (error) {
      console.error('Error marking assignment complete:', error);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;

    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignment deleted successfully.",
      });

      fetchAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast({
        title: "Error",
        description: "Failed to delete assignment.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      deadline: "",
      file: null
    });
  };

  const canManage = (assignment: Assignment) => {
    return assignment.created_by === user?.id || 
           ['lecturer', 'admin', 'super_admin'].includes(profile?.role);
  };

  const canCreate = () => {
    // Allow all authenticated users to create assignments
    return user !== null;
  };

  const isCompleted = (assignment: Assignment) => {
    return assignment.assignment_completions.some(c => c.user_id === user?.id);
  };

  const canDelete = (assignment: Assignment) => {
    return assignment.created_by === user?.id || 
           ['lecturer', 'admin', 'super_admin'].includes(profile?.role);
  };

  const getDeadlineStatus = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    
    if (isAfter(now, deadlineDate)) {
      return { status: 'overdue', color: 'bg-red-100 text-red-800' };
    } else if (deadlineDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return { status: 'due-soon', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'upcoming', color: 'bg-green-100 text-green-800' };
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading assignments..." variant="minimal" size="sm" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center justify-between">
        <h2 className="text-2xl font-bold">Assignments</h2>
          {canCreate() && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Share Assignment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Share Assignment</DialogTitle>
                  <DialogDescription>
                    Share an assignment with your classmates. This helps everyone keep track of what the teacher gave us.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Assignment Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Math Homework Chapter 5"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">What did the teacher ask us to do? *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe what the teacher asked us to do..."
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="deadline">When is it due? *</Label>
                    <Input
                      id="deadline"
                      type="datetime-local"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="file">Assignment File (Optional)</Label>
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
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateAssignment} disabled={isUploading}>
                    {isUploading ? "Sharing..." : "Share Assignment"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
      </div>

      <div className="space-y-4">
            {assignments.map((assignment) => {
              const deadlineStatus = getDeadlineStatus(assignment.deadline);
              const completed = isCompleted(assignment);
              
              return (
                <Card key={assignment.id} className={completed ? "bg-green-50" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={assignment.profiles.profile_picture_url} />
                          <AvatarFallback>
                            {assignment.profiles.full_name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{assignment.title}</h3>
                            {completed && (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            by {assignment.profiles.full_name} • {format(new Date(assignment.created_at), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-sm mt-2">{assignment.description}</p>
                        </div>
                      </div>
                      {canDelete(assignment) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAssignment(assignment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <Badge className={deadlineStatus.color}>
                          <Calendar className="h-3 w-3 mr-1" />
                          {deadlineStatus.status === 'overdue' ? 'Overdue' : 
                           deadlineStatus.status === 'due-soon' ? 'Due Soon' : 'Upcoming'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Due: {format(new Date(assignment.deadline), 'MMM dd, yyyy HH:mm')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({formatDistanceToNow(new Date(assignment.deadline), { addSuffix: true })})
                        </span>
                      </div>
                    </div>

                    {assignment.file_url && (
                      <div className="mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(assignment.file_url, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Assignment
                        </Button>
                      </div>
                    )}
                    
                    {!completed && !canManage(assignment) && (
                      <Button
                        onClick={() => handleMarkComplete(assignment.id)}
                        className="w-full"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Complete
                      </Button>
                    )}
                    
                    {completed && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Completed</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            
            {assignments.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No assignments yet</h3>
                <p className="text-muted-foreground">
                  Assignments will appear here when created by your lecturer.
                </p>
              </div>
            )}
          </div>
    </div>
  );
}
