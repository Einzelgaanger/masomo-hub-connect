import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Users,
  BookOpen,
  Share2,
  Copy,
  Check,
  Loader2,
  MessageSquare,
  Settings,
  UserPlus,
  X,
  Clock,
  Mail,
  CheckCircle,
  XCircle,
  UserMinus,
  LogOut,
  Shield,
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ClassChatroom } from '@/components/class/ClassChatroom';
import { ClassUnitsView } from '@/components/class/ClassUnitsView';
import { ManageClassUnits } from '@/components/class/ManageClassUnits';

interface ClassData {
  id: string;
  name: string;
  description: string;
  share_code: string;
  creator_id: string;
  created_at: string;
  member_count: number;
  unit_count: number;
  unread_messages: number;
  is_creator: boolean;
}

interface Unit {
  id: string;
  name: string;
  description: string;
  unit_order: number;
}

interface JoinRequest {
  id: string;
  requester_name: string;
  requester_email: string;
  requested_at: string;
  user_id: string;
}

interface Member {
  user_id: string;
  role: string;
  joined_at: string;
  profiles: {
    full_name: string;
    email: string;
    profile_picture_url: string;
  };
}

export default function MasomoNew() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [myClasses, setMyClasses] = useState<ClassData[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Create Class Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingClass, setCreatingClass] = useState(false);
  const [className, setClassName] = useState('');
  const [classDescription, setClassDescription] = useState('');
  const [units, setUnits] = useState<Array<{ name: string; description: string }>>([
    { name: '', description: '' }
  ]);

  // Join Class Modal
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joiningClass, setJoiningClass] = useState(false);
  const [joinName, setJoinName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [previewClass, setPreviewClass] = useState<any>(null);
  const [previewUnits, setPreviewUnits] = useState<Unit[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Membership Management
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);
  const [classMembers, setClassMembers] = useState<Member[]>([]);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingRequest, setRejectingRequest] = useState<string | null>(null);

  // Chatroom
  const [chatroomId, setChatroomId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyClasses();
      fetchUserName();
    }
  }, [user]);

  useEffect(() => {
    if (selectedClassId) {
      fetchPendingRequests();
      fetchClassMembers();
      fetchChatroomId();
    }
  }, [selectedClassId]);

  const fetchChatroomId = async () => {
    if (!selectedClassId) return;
    
    try {
      const { data } = await supabase
        .from('class_chatrooms')
        .select('id')
        .eq('class_id', selectedClassId)
        .single();
      
      setChatroomId(data?.id || null);
    } catch (error) {
      console.error('Error fetching chatroom ID:', error);
    }
  };

  const fetchUserName = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user?.id)
        .single();
      
      if (data) {
        setJoinName(data.full_name);
      }
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
  };

  const fetchMyClasses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch classes where user is a member
      const { data: memberships, error } = await supabase
        .from('class_members')
        .select(`
          class_id,
          role,
          classes (
            id,
            name,
            description,
            share_code,
            creator_id,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: true });

      if (error) throw error;

      // Process each class to get counts
      const classesWithCounts = await Promise.all(
        (memberships || []).map(async (membership: any) => {
          const classData = membership.classes;
          
          // Get member count
          const { count: memberCount } = await supabase
            .from('class_members')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', classData.id);

          // Get unit count
          const { count: unitCount } = await supabase
            .from('class_units')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', classData.id);

          return {
            id: classData.id,
            name: classData.name,
            description: classData.description,
            share_code: classData.share_code,
            creator_id: classData.creator_id,
            created_at: classData.created_at,
            member_count: memberCount || 0,
            unit_count: unitCount || 0,
            unread_messages: 0, // TODO: Implement unread count
            is_creator: membership.role === 'creator',
          };
        })
      );

      setMyClasses(classesWithCounts);

      // Auto-select first class if none selected
      if (classesWithCounts.length > 0 && !selectedClassId) {
        setSelectedClassId(classesWithCounts[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Create Class Functions
  const addUnit = () => {
    setUnits([...units, { name: '', description: '' }]);
  };

  const removeUnit = (index: number) => {
    setUnits(units.filter((_, i) => i !== index));
  };

  const updateUnit = (index: number, field: 'name' | 'description', value: string) => {
    const newUnits = [...units];
    newUnits[index][field] = value;
    setUnits(newUnits);
  };

  const handleCreateClass = async () => {
    if (!className.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a class name',
        variant: 'destructive',
      });
      return;
    }

    const validUnits = units.filter(u => u.name.trim());
    if (validUnits.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one unit',
        variant: 'destructive',
      });
      return;
    }

    setCreatingClass(true);
    try {
      // Create the class
      const { data: newClass, error: classError } = await supabase
        .from('classes')
        .insert({
          name: className.trim(),
          description: classDescription.trim(),
          creator_id: user?.id,
        })
        .select()
        .single();

      if (classError) throw classError;

      // Create units for this class
      const unitsToInsert = validUnits.map((unit, index) => ({
        class_id: newClass.id,
        name: unit.name.trim(),
        description: unit.description.trim() || null,
        unit_order: index,
      }));

      const { error: unitsError } = await supabase
        .from('class_units')
        .insert(unitsToInsert);

      if (unitsError) throw unitsError;

      toast({
        title: 'Success!',
        description: `Class "${className}" created successfully! Share code: ${newClass.share_code}`,
      });

      // Reset form
      setClassName('');
      setClassDescription('');
      setUnits([{ name: '', description: '' }]);
      setShowCreateModal(false);
      
      // Refresh classes
      fetchMyClasses();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setCreatingClass(false);
    }
  };

  // Search for classes
  const handleSearchClasses = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, description, share_code, creator_id')
        .ilike('name', `%${searchQuery}%`)
        .eq('is_searchable', true)
        .limit(20);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  // Join Class Functions
  const handlePreviewClass = async (classCode?: string) => {
    const codeToUse = classCode || joinCode.trim().toUpperCase();
    
    if (!codeToUse) {
      toast({
        title: 'Error',
        description: 'Please enter a class code',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Find class by share_code
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('share_code', codeToUse)
        .single();

      if (classError || !classData) {
        toast({
          title: 'Not Found',
          description: 'No class found with this code',
          variant: 'destructive',
        });
        return;
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from('class_members')
        .select('id')
        .eq('class_id', classData.id)
        .eq('user_id', user?.id)
        .single();

      if (existing) {
        toast({
          title: 'Already a Member',
          description: 'You are already a member of this class',
        });
        return;
      }

      // Check if already requested
      const { data: existingRequest } = await supabase
        .from('class_join_requests')
        .select('id, status')
        .eq('class_id', classData.id)
        .eq('user_id', user?.id)
        .eq('status', 'pending')
        .single();

      if (existingRequest) {
        toast({
          title: 'Request Pending',
          description: 'You have already requested to join this class',
        });
        return;
      }

      // Fetch units for preview
      const { data: unitsData } = await supabase
        .from('class_units')
        .select('*')
        .eq('class_id', classData.id)
        .order('unit_order');

      setPreviewClass(classData);
      setPreviewUnits(unitsData || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleJoinClass = async () => {
    if (!joinName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your name',
        variant: 'destructive',
      });
      return;
    }

    if (!previewClass) return;

    setJoiningClass(true);
    try {
      // Get user email
      const { data: profileData } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', user?.id)
        .single();

      // Create join request
      const { error } = await supabase
        .from('class_join_requests')
        .insert({
          class_id: previewClass.id,
          user_id: user?.id,
          requester_name: joinName.trim(),
          requester_email: profileData?.email || user?.email,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: 'Request Sent!',
        description: 'Your join request has been sent to the class creator',
      });

      // Reset form
      setJoinCode('');
      setPreviewClass(null);
      setPreviewUnits([]);
      setShowJoinModal(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setJoiningClass(false);
    }
  };

  const copyShareCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Share code copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // Fetch pending join requests (for class creators)
  const fetchPendingRequests = async () => {
    if (!selectedClassId) return;
    
    try {
      const { data, error } = await supabase
        .from('class_join_requests')
        .select('*')
        .eq('class_id', selectedClassId)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setPendingRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching join requests:', error);
    }
  };

  // Fetch class members
  const fetchClassMembers = async () => {
    if (!selectedClassId) return;
    
    try {
      const { data, error } = await supabase
        .from('class_members')
        .select(`
          user_id,
          role,
          joined_at,
          profiles (
            full_name,
            email,
            profile_picture_url
          )
        `)
        .eq('class_id', selectedClassId)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      setClassMembers(data || []);
    } catch (error: any) {
      console.error('Error fetching members:', error);
    }
  };

  // Approve join request
  const handleApproveRequest = async (requestId: string) => {
    try {
      const { error } = await supabase.rpc('approve_join_request', {
        p_request_id: requestId,
        p_approver_id: user?.id,
      });

      if (error) throw error;

      toast({
        title: 'Approved!',
        description: 'Member added to the class',
      });

      fetchPendingRequests();
      fetchClassMembers();
      fetchMyClasses(); // Refresh member counts
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Reject join request
  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase.rpc('reject_join_request', {
        p_request_id: requestId,
        p_approver_id: user?.id,
        p_reason: rejectReason.trim() || null,
      });

      if (error) throw error;

      toast({
        title: 'Rejected',
        description: 'Join request rejected',
      });

      setRejectingRequest(null);
      setRejectReason('');
      fetchPendingRequests();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Remove member from class
  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from this class?`)) return;

    try {
      const { error } = await supabase
        .from('class_members')
        .delete()
        .eq('class_id', selectedClassId)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Member removed from class',
      });

      fetchClassMembers();
      fetchMyClasses();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Leave class
  const handleLeaveClass = async () => {
    if (!selectedClassId) return;
    
    const classToLeave = myClasses.find(c => c.id === selectedClassId);
    if (!confirm(`Are you sure you want to leave "${classToLeave?.name}"? Your uploads and comments will remain.`)) return;

    try {
      const { error } = await supabase
        .from('class_members')
        .delete()
        .eq('class_id', selectedClassId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: 'Left Class',
        description: 'You have left the class',
      });

      fetchMyClasses();
      setSelectedClassId(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const selectedClass = myClasses.find(c => c.id === selectedClassId);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-4 max-w-7xl space-y-4">
        {/* Class Tabs */}
        {myClasses.length > 0 && (
          <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 pb-4 -mt-4 pt-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {myClasses.map((cls) => (
                <Button
                  key={cls.id}
                  variant={selectedClassId === cls.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedClassId(cls.id)}
                  className="flex-shrink-0 relative"
                >
                  {cls.name}
                  {cls.unread_messages > 0 && (
                    <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-red-500">
                      {cls.unread_messages}
                    </Badge>
                  )}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCreateModal(false);
                  setShowJoinModal(false);
                  navigate('/masomo/manage');
                }}
                className="flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Empty State - No Classes */}
        {myClasses.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Welcome to Masomo!</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Get started by creating your own class or joining an existing one
              </p>
              <div className="flex gap-4">
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Class
                </Button>
                <Button variant="outline" onClick={() => setShowJoinModal(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Join Class
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selected Class Content */}
        {selectedClass && (
          <div className="space-y-4">
            {/* Class Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{selectedClass.name}</CardTitle>
                    {selectedClass.description && (
                      <p className="text-muted-foreground">{selectedClass.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {selectedClass.member_count} members
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {selectedClass.unit_count} units
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{selectedClass.share_code}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyShareCode(selectedClass.share_code)}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    {selectedClass.is_creator && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/masomo/class/${selectedClass.id}/manage`)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Class Tabs - Chatroom, Units, Members, Requests */}
            <Tabs defaultValue="chatroom" className="w-full">
              <TabsList className={`grid w-full ${selectedClass?.is_creator ? 'grid-cols-4' : 'grid-cols-3'}`}>
                <TabsTrigger value="chatroom">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chatroom
                </TabsTrigger>
                <TabsTrigger value="units">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Units
                </TabsTrigger>
                <TabsTrigger value="members">
                  <Users className="h-4 w-4 mr-2" />
                  Members ({classMembers.length})
                </TabsTrigger>
                {selectedClass?.is_creator && (
                  <TabsTrigger value="requests" className="relative">
                    <Clock className="h-4 w-4 mr-2" />
                    Requests
                    {pendingRequests.length > 0 && (
                      <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-red-500">
                        {pendingRequests.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="chatroom">
                <ClassChatroom 
                  classId={selectedClassId!} 
                  chatroomId={chatroomId} 
                />
              </TabsContent>

              <TabsContent value="units">
                {selectedClass?.is_creator ? (
                  <div className="space-y-4">
                    <ManageClassUnits classId={selectedClassId!} />
                  </div>
                ) : (
                  <ClassUnitsView 
                    classId={selectedClassId!} 
                    isCreator={false} 
                  />
                )}
              </TabsContent>

              {/* Members Tab */}
              <TabsContent value="members">
                <Card>
                  <CardHeader>
                    <CardTitle>Class Members ({classMembers.length})</CardTitle>
                    {!selectedClass?.is_creator && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleLeaveClass}
                        className="ml-auto"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Leave Class
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {classMembers.map((member) => (
                        <div
                          key={member.user_id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={member.profiles.profile_picture_url} />
                              <AvatarFallback>
                                {member.profiles.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.profiles.full_name}</p>
                              <p className="text-sm text-muted-foreground">{member.profiles.email}</p>
                              <p className="text-xs text-muted-foreground">
                                Joined {new Date(member.joined_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {member.role === 'creator' && (
                              <Badge variant="default">
                                <Shield className="h-3 w-3 mr-1" />
                                Creator
                              </Badge>
                            )}
                            {selectedClass?.is_creator && member.user_id !== user?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(member.user_id, member.profiles.full_name)}
                              >
                                <UserMinus className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {classMembers.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No members yet
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pending Requests Tab (Only for Creators) */}
              {selectedClass?.is_creator && (
                <TabsContent value="requests">
                  <Card>
                    <CardHeader>
                      <CardTitle>Pending Join Requests ({pendingRequests.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {pendingRequests.map((request) => (
                          <div
                            key={request.id}
                            className="border rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-medium">{request.requester_name}</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {request.requester_email}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Requested {new Date(request.requested_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            
                            {rejectingRequest === request.id ? (
                              <div className="space-y-2">
                                <Label htmlFor={`reject-reason-${request.id}`}>Rejection Reason (optional)</Label>
                                <Textarea
                                  id={`reject-reason-${request.id}`}
                                  placeholder="Enter reason for rejection..."
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                  rows={2}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setRejectingRequest(null);
                                      setRejectReason('');
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRejectRequest(request.id)}
                                  >
                                    Confirm Reject
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveRequest(request.id)}
                                  className="flex-1"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setRejectingRequest(request.id)}
                                  className="flex-1"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {pendingRequests.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                          No pending requests
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}

        {/* Create Class Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
              <DialogDescription>
                Create a class and add units. You'll get a shareable code to invite members.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Class Name */}
              <div>
                <Label htmlFor="className">Class Name *</Label>
                <Input
                  id="className"
                  placeholder="e.g., Computer Science Year 3"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                />
              </div>

              {/* Class Description */}
              <div>
                <Label htmlFor="classDescription">Description</Label>
                <Textarea
                  id="classDescription"
                  placeholder="Brief description of this class..."
                  rows={3}
                  value={classDescription}
                  onChange={(e) => setClassDescription(e.target.value)}
                />
              </div>

              {/* Units */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Units *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addUnit}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Unit
                  </Button>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {units.map((unit, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder={`Unit ${index + 1} name`}
                          value={unit.name}
                          onChange={(e) => updateUnit(index, 'name', e.target.value)}
                        />
                        <Input
                          placeholder={`Unit ${index + 1} description (optional)`}
                          value={unit.description}
                          onChange={(e) => updateUnit(index, 'description', e.target.value)}
                        />
                      </div>
                      {units.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeUnit(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                disabled={creatingClass}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateClass} disabled={creatingClass}>
                {creatingClass ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Class
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Join Class Modal */}
        <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Join a Class</DialogTitle>
              <DialogDescription>
                Enter your name and the class code to request access
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {!previewClass ? (
                <>
                  <div>
                    <Label htmlFor="joinName">Your Name *</Label>
                    <Input
                      id="joinName"
                      placeholder="Enter your full name"
                      value={joinName}
                      onChange={(e) => setJoinName(e.target.value)}
                    />
                  </div>

                  <div className="relative">
                    <Label>Search for Classes or Enter Code</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Search by class name..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          if (e.target.value.length > 2) {
                            handleSearchClasses();
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        onClick={handleSearchClasses}
                        disabled={searching}
                      >
                        {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                      </Button>
                    </div>
                    
                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
                        {searchResults.map((cls) => (
                          <div
                            key={cls.id}
                            className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                            onClick={() => {
                              setJoinCode(cls.share_code);
                              setSearchQuery('');
                              setSearchResults([]);
                              handlePreviewClass(cls.share_code);
                            }}
                          >
                            <p className="font-medium">{cls.name}</p>
                            <p className="text-xs text-muted-foreground">Code: {cls.share_code}</p>
                            {cls.description && (
                              <p className="text-xs text-muted-foreground mt-1">{cls.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-center text-sm text-muted-foreground">OR</div>

                  <div>
                    <Label htmlFor="joinCode">Class Code</Label>
                    <Input
                      id="joinCode"
                      placeholder="e.g., ABC123XY"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      maxLength={8}
                    />
                  </div>
                  <Button onClick={() => handlePreviewClass()} className="w-full">
                    Preview Class
                  </Button>
                </>
              ) : (
                <>
                  {/* Class Preview */}
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <h3 className="font-semibold text-lg mb-2">{previewClass.name}</h3>
                    {previewClass.description && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {previewClass.description}
                      </p>
                    )}
                    <div className="space-y-2">
                      <p className="font-medium text-sm">Units in this class:</p>
                      <div className="space-y-1">
                        {previewUnits.map((unit) => (
                          <div key={unit.id} className="flex items-start gap-2 text-sm">
                            <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium">{unit.name}</p>
                              {unit.description && (
                                <p className="text-xs text-muted-foreground">{unit.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPreviewClass(null);
                        setPreviewUnits([]);
                      }}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button onClick={handleJoinClass} disabled={joiningClass} className="flex-1">
                      {joiningClass ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Requesting...
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Request to Join
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Floating Action Button for Create/Join */}
        {myClasses.length > 0 && (
          <div className="fixed bottom-6 right-6 flex flex-col gap-2">
            <Button
              size="icon"
              className="rounded-full h-12 w-12 shadow-lg"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-6 w-6" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="rounded-full h-12 w-12 shadow-lg"
              onClick={() => setShowJoinModal(true)}
            >
              <UserPlus className="h-6 w-6" />
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

