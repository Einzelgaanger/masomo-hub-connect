import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  Users, 
  BookOpen, 
  Calendar,
  Settings,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  X,
  ArrowRight,
  Key,
  RefreshCw,
  Copy,
  Clock
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import CreateClassForm from "@/components/classes/CreateClassForm";
import JoinClassForm from "@/components/classes/JoinClassForm";
import ClassChatroom from "@/components/classes/ClassChatroom";
import RoleTransferForm from "@/components/classes/RoleTransferForm";
import { CodeManagement } from "@/components/classes/CodeManagement";

interface UserClass {
  id: string;
  name: string;
  description: string;
  class_code: string;
  role: 'creator' | 'member';
  units_count: number;
  members_count: number;
  created_at: string;
  last_activity?: string;
  code_expires?: boolean;
  code_expires_at?: string | null;
  code_created_at?: string;
}

interface JoinRequest {
  id: string;
  class_id: string;
  user_id: string;
  full_name: string;
  email: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  class_name: string;
}

const Masomo = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [userClasses, setUserClasses] = useState<UserClass[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [isJoinClassOpen, setIsJoinClassOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('my-classes');
  const [selectedClassForChat, setSelectedClassForChat] = useState<UserClass | null>(null);
  const [selectedClassForTransfer, setSelectedClassForTransfer] = useState<UserClass | null>(null);
  const [selectedClassForCodeManagement, setSelectedClassForCodeManagement] = useState<UserClass | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserClasses();
      fetchJoinRequests();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserClasses = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('class_members')
        .select(`
          class_id,
          role,
          joined_at,
          classes(
            id,
            name,
            description,
            class_code,
            created_at,
            code_expires,
            code_expires_at,
            code_created_at
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // Handle empty data (no classes joined)
      if (!data || data.length === 0) {
        setUserClasses([]);
        setLoading(false);
        return;
      }

      // Filter out memberships with invalid class data
      const validMemberships = data.filter(membership => 
        membership.classes && membership.classes.id
      );

      if (validMemberships.length === 0) {
        setUserClasses([]);
        setLoading(false);
        return;
      }

      // Get additional info for each class
      const classesWithInfo = await Promise.all(
        validMemberships.map(async (membership) => {
          const [unitsResult, membersResult] = await Promise.all([
            supabase
              .from('class_units')
              .select('id', { count: 'exact', head: true })
              .eq('class_id', membership.class_id),
            supabase
              .from('class_members')
              .select('id', { count: 'exact', head: true })
              .eq('class_id', membership.class_id)
          ]);

          return {
            id: membership.classes.id,
            name: membership.classes.name,
            description: membership.classes.description,
            class_code: membership.classes.class_code,
            role: membership.role,
            units_count: unitsResult.count || 0,
            members_count: membersResult.count || 0,
            created_at: membership.classes.created_at,
            joined_at: membership.joined_at,
            code_expires: membership.classes.code_expires,
            code_expires_at: membership.classes.code_expires_at,
            code_created_at: membership.classes.code_created_at
          };
        })
      );

      setUserClasses(classesWithInfo);
    } catch (error) {
      console.error('Error fetching user classes:', error);
      setUserClasses([]); // Set empty array on error
      toast({
        title: "Error",
        description: "Failed to load your classes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchJoinRequests = async () => {
    if (!user) return;

    try {
      // Get classes where user is creator
      const { data: userClasses, error: classesError } = await supabase
        .from('class_members')
        .select('class_id')
        .eq('user_id', user.id)
        .eq('role', 'creator');

      if (classesError) throw classesError;

      if (!userClasses || userClasses.length === 0) {
        setJoinRequests([]);
        return;
      }

      const classIds = userClasses
        .map(c => c.id)
        .filter(id => id && id !== 'undefined'); // Filter out invalid IDs

      if (classIds.length === 0) {
        setJoinRequests([]);
        return;
      }

      // First get the join requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('class_join_requests')
        .select(`
          id,
          class_id,
          user_id,
          requester_name,
          requester_email,
          request_message,
          status,
          requested_at,
          classes(name)
        `)
        .in('class_id', classIds)
        .in('status', ['pending', 'rejected'])
        .order('requested_at', { ascending: false });

      if (requestsError) throw requestsError;

      if (!requestsData || requestsData.length === 0) {
        setJoinRequests([]);
        return;
      }

      // Get user profiles for the join requests
      const userIds = requestsData.map(req => req.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      
      setJoinRequests(requestsData.map(req => {
        return {
          id: req.id,
          class_id: req.class_id,
          user_id: req.user_id,
          full_name: req.requester_name || 'Unknown User',
          email: req.requester_email || 'Unknown Email',
          message: req.request_message,
          status: req.status,
          requested_at: req.requested_at,
          class_name: req.classes?.name || 'Unknown Class'
        };
      }));
    } catch (error) {
      console.error('Error fetching join requests:', error);
      setJoinRequests([]); // Set empty array on error
    }
  };

  const handleClassCreated = (classData: any) => {
    setIsCreateClassOpen(false);
    fetchUserClasses();
    toast({
      title: "Class Created",
      description: `Your class "${classData.name}" has been created successfully!`,
    });
  };

  const handleClassJoined = (classData: any) => {
    setIsJoinClassOpen(false);
    toast({
      title: "Join Request Sent",
      description: `Your request to join "${classData.name}" has been sent for approval.`,
    });
  };

  const handleRoleTransferred = () => {
    setSelectedClassForTransfer(null);
    fetchUserClasses(); // Refresh classes to update roles
  };

  const handleCodeUpdated = (newCode: string) => {
    setSelectedClassForCodeManagement(null);
    fetchUserClasses();
  };

  const handleApproveRequest = async (requestId: string, classId: string, userId: string) => {
    try {
      // Update request status to approved
      const { error: updateError } = await supabase
        .from('class_join_requests')
        .update({ 
          status: 'approved', 
          responded_at: new Date().toISOString(),
          responder_id: user?.id 
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Add user to class_members
      const { error: memberError } = await supabase
        .from('class_members')
        .insert({
          class_id: classId,
          user_id: userId,
          role: 'student'
        });

      if (memberError) throw memberError;

      toast({
        title: "Request Approved",
        description: "The user has been added to the class.",
      });

      fetchJoinRequests();
      fetchUserClasses();
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "Error",
        description: "Failed to approve request.",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    
    try {
      const { error } = await supabase
        .from('class_join_requests')
        .update({ 
          status: 'rejected', 
          responded_at: new Date().toISOString(),
          responder_id: user?.id,
          rejection_reason: reason || null
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request Rejected",
        description: "The join request has been rejected.",
      });

      fetchJoinRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Error",
        description: "Failed to reject request.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Masomo</h1>
            <p className="text-muted-foreground">Create and join classes to share knowledge</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsCreateClassOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Class
            </Button>
            <Button variant="outline" onClick={() => setIsJoinClassOpen(true)}>
              <Search className="h-4 w-4 mr-2" />
              Join Class
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{userClasses.length}</p>
                  <p className="text-sm text-muted-foreground">My Classes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {userClasses.reduce((sum, c) => sum + c.members_count, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{joinRequests.length}</p>
                  <p className="text-sm text-muted-foreground">Pending Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-classes">My Classes</TabsTrigger>
            <TabsTrigger value="requests">Join Requests</TabsTrigger>
          </TabsList>

          {/* My Classes Tab */}
          <TabsContent value="my-classes" className="space-y-4">
            {userClasses.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Classes Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first class or join an existing one to get started.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => setIsCreateClassOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Class
                    </Button>
                    <Button variant="outline" onClick={() => setIsJoinClassOpen(true)}>
                      <Search className="h-4 w-4 mr-2" />
                      Join Class
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userClasses.map((classItem) => (
                  <Card 
                    key={classItem.id} 
                    className="hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => navigate(`/class/${classItem.id}/units`)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                          {classItem.name}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant={classItem.role === 'creator' ? 'default' : 'outline'}>
                            {classItem.role === 'creator' ? 'Creator' : 'Member'}
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{classItem.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span>{classItem.units_count} units</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{classItem.members_count} members</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {classItem.class_code}
                        </Badge>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedClassForChat(classItem)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Chat
                          </Button>
                          {classItem.role === 'creator' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedClassForCodeManagement(classItem)}
                                title="Manage Class Code"
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedClassForTransfer(classItem)}
                                title="Transfer Role"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Join Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            {joinRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
                  <p className="text-muted-foreground">
                    All join requests have been processed.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {joinRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{request.full_name}</h3>
                            <Badge variant="outline">{request.class_name}</Badge>
                            <Badge 
                              variant={request.status === 'pending' ? 'default' : 'destructive'}
                              className={request.status === 'pending' ? 'bg-yellow-500' : ''}
                            >
                              {request.status === 'pending' ? 'Pending' : 'Rejected'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{request.email}</p>
                          {request.message && (
                            <p className="text-sm">{request.message}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Requested {new Date(request.requested_at).toLocaleDateString()}
                          </p>
                        </div>
                        {request.status === 'pending' ? (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleApproveRequest(request.id, request.class_id, request.user_id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRejectRequest(request.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Request was rejected
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Class Dialog */}
        <Dialog open={isCreateClassOpen} onOpenChange={setIsCreateClassOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
              <DialogDescription>
                Create a class to share knowledge with students. Add units and invite others to join.
              </DialogDescription>
            </DialogHeader>
            <CreateClassForm
              onSuccess={handleClassCreated}
              onCancel={() => setIsCreateClassOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Join Class Dialog */}
        <Dialog open={isJoinClassOpen} onOpenChange={setIsJoinClassOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Join a Class</DialogTitle>
              <DialogDescription>
                Enter a class code to join an existing class. Your request will be sent for approval.
              </DialogDescription>
            </DialogHeader>
            <JoinClassForm
              onSuccess={handleClassJoined}
              onCancel={() => setIsJoinClassOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Class Chatroom Dialog */}
        <Dialog open={!!selectedClassForChat} onOpenChange={() => setSelectedClassForChat(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Class Chat - {selectedClassForChat?.name}</DialogTitle>
              <DialogDescription>
                Chat with your classmates about {selectedClassForChat?.name}
              </DialogDescription>
            </DialogHeader>
            {selectedClassForChat && (
              <ClassChatroom
                classId={selectedClassForChat.id}
                className={selectedClassForChat.name}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Role Transfer Dialog */}
        <Dialog open={!!selectedClassForTransfer} onOpenChange={() => setSelectedClassForTransfer(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Class Settings - {selectedClassForTransfer?.name}</DialogTitle>
              <DialogDescription>
                Manage your class settings and transfer creator role.
              </DialogDescription>
            </DialogHeader>
            {selectedClassForTransfer && (
              <RoleTransferForm
                classId={selectedClassForTransfer.id}
                className={selectedClassForTransfer.name}
                onSuccess={handleRoleTransferred}
                onCancel={() => setSelectedClassForTransfer(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Code Management Dialog */}
        {selectedClassForCodeManagement && (
          <CodeManagement
            classInfo={{
              id: selectedClassForCodeManagement.id,
              name: selectedClassForCodeManagement.name,
              class_code: selectedClassForCodeManagement.class_code,
              code_expires: selectedClassForCodeManagement.code_expires || false,
              code_expires_at: selectedClassForCodeManagement.code_expires_at || null,
              code_created_at: selectedClassForCodeManagement.code_created_at || selectedClassForCodeManagement.created_at
            }}
            isOpen={!!selectedClassForCodeManagement}
            onClose={() => setSelectedClassForCodeManagement(null)}
            onCodeUpdated={handleCodeUpdated}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default Masomo;
