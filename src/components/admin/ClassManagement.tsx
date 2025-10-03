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
      
      // First, fetch classes (limit to 50 for better performance)
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (classesError) throw classesError;

      // Early return if no classes found
      if (!classesData || classesData.length === 0) {
        setClasses([]);
        setLoading(false);
        return;
      }

      // Then fetch creator profiles separately
      const creatorIds = classesData?.map(c => c.creator_id) || [];
      const { data: creatorsData, error: creatorsError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', creatorIds);

      if (creatorsError) throw creatorsError;

      // Combine the data
      const data = classesData?.map(classItem => ({
        ...classItem,
        profiles: creatorsData?.find(creator => creator.user_id === classItem.creator_id) || null
      }));

      // Get stats for all classes in bulk (much faster!)
      const classIds = data?.map(c => c.id) || [];
      
      const [membersData, unitsData, messagesData, requestsData] = await Promise.all([
        supabase
          .from('class_members')
          .select('class_id')
          .in('class_id', classIds)
          .then(result => result.error ? { data: [] } : result),
        supabase
          .from('class_units')
          .select('class_id')
          .in('class_id', classIds)
          .then(result => result.error ? { data: [] } : result),
        supabase
          .from('class_chat_messages')
          .select('class_id')
          .in('class_id', classIds)
          .then(result => result.error ? { data: [] } : result),
        supabase
          .from('class_join_requests')
          .select('class_id')
          .in('class_id', classIds)
          .eq('status', 'pending')
          .then(result => result.error ? { data: [] } : result)
      ]);

      // Count stats by class_id
      const membersCounts = membersData.data?.reduce((acc, item) => {
        acc[item.class_id] = (acc[item.class_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const unitsCounts = unitsData.data?.reduce((acc, item) => {
        acc[item.class_id] = (acc[item.class_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const messagesCounts = messagesData.data?.reduce((acc, item) => {
        acc[item.class_id] = (acc[item.class_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const requestsCounts = requestsData.data?.reduce((acc, item) => {
        acc[item.class_id] = (acc[item.class_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Combine data with stats
      const classesWithStats = data?.map(classItem => ({
        id: classItem.id,
        name: classItem.name,
        description: classItem.description,
        class_code: classItem.class_code,
        creator_id: classItem.creator_id,
        created_at: classItem.created_at,
        is_active: classItem.is_active,
        creator_name: classItem.profiles?.full_name || 'Unknown',
        creator_email: classItem.profiles?.email || 'Unknown',
        members_count: membersCounts[classItem.id] || 0,
        units_count: unitsCounts[classItem.id] || 0,
        messages_count: messagesCounts[classItem.id] || 0,
        join_requests_count: requestsCounts[classItem.id] || 0
      })) || [];

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
      
      // First, fetch class members
      const { data: membersData, error: membersError } = await supabase
        .from('class_members')
        .select('*')
        .eq('class_id', classId)
        .order('joined_at', { ascending: false });

      if (membersError) throw membersError;

      // Then fetch member profiles separately
      const memberIds = membersData?.map(m => m.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, profile_picture_url')
        .in('user_id', memberIds);

      if (profilesError) throw profilesError;

      const transformedMembers = (membersData || []).map(member => {
        const profile = profilesData?.find(p => p.user_id === member.user_id);
        return {
          id: member.id,
          user_id: member.user_id,
          role: member.role,
          joined_at: member.joined_at,
          full_name: profile?.full_name || 'Unknown',
          email: profile?.email || 'Unknown',
          profile_picture_url: profile?.profile_picture_url
        };
      });

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
