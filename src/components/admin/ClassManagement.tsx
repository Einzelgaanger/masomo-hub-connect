import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Building, 
  Users, 
  Calendar, 
  Search, 
  Eye, 
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Crown,
  MessageSquare,
  BookOpen
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

interface ClassData {
  id: string;
  name: string;
  description: string;
  class_code: string;
  creator_id: string;
  created_at: string;
  is_active: boolean;
  creator_name: string;
  creator_email: string;
  members_count: number;
  units_count: number;
  messages_count: number;
  join_requests_count: number;
}

interface ClassMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  full_name: string;
  email: string;
  profile_picture_url?: string;
}

const ClassManagement = () => {
  const { toast } = useToast();
  
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [classMembers, setClassMembers] = useState<ClassMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [classToDelete, setClassToDelete] = useState<ClassData | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          profiles!classes_creator_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get additional stats for each class
      const classesWithStats = await Promise.all(
        (data || []).map(async (classItem) => {
          const [membersResult, unitsResult, messagesResult, requestsResult] = await Promise.all([
            supabase
              .from('class_members')
              .select('id', { count: 'exact', head: true })
              .eq('class_id', classItem.id),
            supabase
              .from('class_units')
              .select('id', { count: 'exact', head: true })
              .eq('class_id', classItem.id),
            supabase
              .from('class_chat_messages')
              .select('id', { count: 'exact', head: true })
              .eq('class_id', classItem.id),
            supabase
              .from('class_join_requests')
              .select('id', { count: 'exact', head: true })
              .eq('class_id', classItem.id)
              .eq('status', 'pending')
          ]);

          return {
            id: classItem.id,
            name: classItem.name,
            description: classItem.description,
            class_code: classItem.class_code,
            creator_id: classItem.creator_id,
            created_at: classItem.created_at,
            is_active: classItem.is_active,
            creator_name: classItem.profiles?.full_name || 'Unknown',
            creator_email: classItem.profiles?.email || 'Unknown',
            members_count: membersResult.count || 0,
            units_count: unitsResult.count || 0,
            messages_count: messagesResult.count || 0,
            join_requests_count: requestsResult.count || 0
          };
        })
      );

      setClasses(classesWithStats);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        title: "Error",
        description: "Failed to load classes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClassMembers = async (classId: string) => {
    try {
      setLoadingMembers(true);
      
      const { data, error } = await supabase
        .from('class_members')
        .select(`
          *,
          profiles!class_members_user_id_fkey(full_name, email, profile_picture_url)
        `)
        .eq('class_id', classId)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      const transformedMembers = (data || []).map(member => ({
        id: member.id,
        user_id: member.user_id,
        role: member.role,
        joined_at: member.joined_at,
        full_name: member.profiles?.full_name || 'Unknown',
        email: member.profiles?.email || 'Unknown',
        profile_picture_url: member.profiles?.profile_picture_url
      }));

      setClassMembers(transformedMembers);
    } catch (error) {
      console.error('Error fetching class members:', error);
      toast({
        title: "Error",
        description: "Failed to load class members.",
        variant: "destructive",
      });
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleViewClass = (classItem: ClassData) => {
    setSelectedClass(classItem);
    fetchClassMembers(classItem.id);
  };

  const handleDeleteClass = async (classItem: ClassData) => {
    try {
      const { error } = await supabase
        .from('classes')
        .update({ is_active: false })
        .eq('id', classItem.id);

      if (error) throw error;

      toast({
        title: "Class Deactivated",
        description: `Class "${classItem.name}" has been deactivated.`,
      });

      fetchClasses();
      setClassToDelete(null);
    } catch (error) {
      console.error('Error deactivating class:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate class.",
        variant: "destructive",
      });
    }
  };

  const filteredClasses = classes.filter(classItem =>
    classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classItem.creator_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classItem.class_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Class Management</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button onClick={fetchClasses} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClasses.map((classItem) => (
          <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg truncate">{classItem.name}</CardTitle>
                <div className="flex items-center gap-1">
                  <Badge variant={classItem.is_active ? "default" : "secondary"}>
                    {classItem.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {classItem.description || "No description"}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{classItem.members_count} members</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span>{classItem.units_count} units</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span>{classItem.messages_count} messages</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{classItem.join_requests_count} pending</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Crown className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium">{classItem.creator_name}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Code: {classItem.class_code}</span>
                  <span>{format(new Date(classItem.created_at), 'MMM dd, yyyy')}</span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewClass(classItem)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setClassToDelete(classItem)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <div className="text-center py-12">
          <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Classes Found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "No classes match your search criteria." : "No classes have been created yet."}
          </p>
        </div>
      )}

      {/* Class Details Dialog */}
      <Dialog open={!!selectedClass} onOpenChange={() => setSelectedClass(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Class Details - {selectedClass?.name}</DialogTitle>
            <DialogDescription>
              View class information and manage members
            </DialogDescription>
          </DialogHeader>
          
          {selectedClass && (
            <div className="space-y-6">
              {/* Class Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Class Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="font-medium">Name:</span> {selectedClass.name}
                    </div>
                    <div>
                      <span className="font-medium">Code:</span> {selectedClass.class_code}
                    </div>
                    <div>
                      <span className="font-medium">Description:</span> {selectedClass.description || "No description"}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {format(new Date(selectedClass.created_at), 'PPP')}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>{' '}
                      <Badge variant={selectedClass.is_active ? "default" : "secondary"}>
                        {selectedClass.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Members:</span>
                      <span className="font-medium">{selectedClass.members_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Units:</span>
                      <span className="font-medium">{selectedClass.units_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Messages:</span>
                      <span className="font-medium">{selectedClass.messages_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Requests:</span>
                      <span className="font-medium">{selectedClass.join_requests_count}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Members List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Class Members ({classMembers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingMembers ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {classMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.profile_picture_url} />
                              <AvatarFallback className="text-xs">
                                {member.full_name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{member.full_name}</span>
                                {member.role === 'creator' && (
                                  <Crown className="h-4 w-4 text-yellow-600" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={member.role === 'creator' ? 'default' : 'outline'}>
                              {member.role}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              Joined {format(new Date(member.joined_at), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!classToDelete} onOpenChange={() => setClassToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Deactivate Class
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate "{classToDelete?.name}"? This will make the class inactive but preserve all data.
              Members will no longer be able to access the class.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => classToDelete && handleDeleteClass(classToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Deactivate Class
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClassManagement;
