import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Trash2,
  UserMinus,
  UserPlus,
  Search,
  Activity,
  BarChart3,
  Loader2,
} from 'lucide-react';
import AdminGuard from '@/components/AdminGuard';
import { AppLayout } from '@/components/layout/AppLayout';

interface ClassStats {
  id: string;
  name: string;
  share_code: string;
  creator_id: string;
  created_at: string;
  member_count: number;
  unit_count: number;
  message_count: number;
  creator_name: string;
  is_active: boolean;
}

interface Analytics {
  totalClasses: number;
  totalStudents: number;
  totalMembers: number;
  averageMembersPerClass: number;
  mostActiveClass: ClassStats | null;
  leastActiveClass: ClassStats | null;
  classesWithNoMembers: number;
}

export default function AdminClassManagement() {
  const { toast } = useToast();
  
  const [classes, setClasses] = useState<ClassStats[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalClasses: 0,
    totalStudents: 0,
    totalMembers: 0,
    averageMembersPerClass: 0,
    mostActiveClass: null,
    leastActiveClass: null,
    classesWithNoMembers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassStats | null>(null);
  const [transferEmail, setTransferEmail] = useState('');

  useEffect(() => {
    fetchClassesAndAnalytics();
  }, []);

  const fetchClassesAndAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch all classes with member counts
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          share_code,
          creator_id,
          created_at,
          class_members(count),
          class_units(count),
          class_chatrooms(
            class_messages(count)
          )
        `)
        .order('created_at', { ascending: false });

      if (classesError) throw classesError;

      // Fetch creator profiles
      const creatorIds = classesData?.map(c => c.creator_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', creatorIds);

      // Map profiles to creators
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      // Process classes data
      const processedClasses: ClassStats[] = (classesData || []).map(cls => {
        const memberCount = cls.class_members?.[0]?.count || 0;
        const unitCount = cls.class_units?.[0]?.count || 0;
        const messageCount = cls.class_chatrooms?.[0]?.class_messages?.[0]?.count || 0;
        
        return {
          id: cls.id,
          name: cls.name,
          share_code: cls.share_code,
          creator_id: cls.creator_id,
          created_at: cls.created_at,
          member_count: memberCount,
          unit_count: unitCount,
          message_count: messageCount,
          creator_name: profileMap.get(cls.creator_id) || 'Unknown',
          is_active: messageCount > 0 || memberCount > 1,
        };
      });

      setClasses(processedClasses);

      // Calculate analytics
      const totalMembers = processedClasses.reduce((sum, cls) => sum + cls.member_count, 0);
      const classesWithMembers = processedClasses.filter(cls => cls.member_count > 0);
      
      const mostActive = processedClasses.length > 0
        ? processedClasses.reduce((max, cls) => 
            cls.message_count > max.message_count ? cls : max
          )
        : null;

      const leastActive = classesWithMembers.length > 0
        ? classesWithMembers.reduce((min, cls) => 
            cls.message_count < min.message_count ? cls : min
          )
        : null;

      // Count total unique students (from profiles with non-null class_id or class_members)
      const { count: studentCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('class_id', 'is', null);

      setAnalytics({
        totalClasses: processedClasses.length,
        totalStudents: studentCount || 0,
        totalMembers,
        averageMembersPerClass: processedClasses.length > 0 
          ? Math.round((totalMembers / processedClasses.length) * 10) / 10 
          : 0,
        mostActiveClass: mostActive,
        leastActiveClass: leastActive,
        classesWithNoMembers: processedClasses.filter(cls => cls.member_count === 0).length,
      });

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) return;

    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', selectedClass.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Class deleted successfully',
      });

      setDeleteDialogOpen(false);
      setSelectedClass(null);
      fetchClassesAndAnalytics();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleTransferCreator = async (classId: string) => {
    if (!transferEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Call the RPC function
      const { data, error } = await supabase.rpc('transfer_class_creator', {
        p_class_id: classId,
        p_current_creator_id: selectedClass?.creator_id,
        p_new_creator_email: transferEmail.trim(),
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Class creator transferred successfully',
      });

      setTransferEmail('');
      setSelectedClass(null);
      fetchClassesAndAnalytics();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMember = async (classId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('class_members')
        .delete()
        .eq('class_id', classId)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Member removed successfully',
      });

      fetchClassesAndAnalytics();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.share_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.creator_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminGuard>
        <AppLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </AppLayout>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <AppLayout>
        <div className="container mx-auto p-4 max-w-7xl space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Class Management & Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Monitor and manage all classes on the platform
            </p>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalClasses}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.classesWithNoMembers} with no members
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalStudents}</div>
                <p className="text-xs text-muted-foreground">
                  Registered in the system
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Class Members</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalMembers}</div>
                <p className="text-xs text-muted-foreground">
                  Total memberships
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Members/Class</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.averageMembersPerClass}</div>
                <p className="text-xs text-muted-foreground">
                  Per class average
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Most/Least Active Classes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Most Active Class
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.mostActiveClass ? (
                  <div>
                    <p className="font-semibold text-lg">{analytics.mostActiveClass.name}</p>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{analytics.mostActiveClass.member_count} members</span>
                      <span>{analytics.mostActiveClass.message_count} messages</span>
                      <span>{analytics.mostActiveClass.unit_count} units</span>
                    </div>
                    <Badge className="mt-2">{analytics.mostActiveClass.share_code}</Badge>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No active classes yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-orange-500" />
                  Least Active Class
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.leastActiveClass ? (
                  <div>
                    <p className="font-semibold text-lg">{analytics.leastActiveClass.name}</p>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{analytics.leastActiveClass.member_count} members</span>
                      <span>{analytics.leastActiveClass.message_count} messages</span>
                      <span>{analytics.leastActiveClass.unit_count} units</span>
                    </div>
                    <Badge className="mt-2">{analytics.leastActiveClass.share_code}</Badge>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No classes with members yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Classes List */}
          <Card>
            <CardHeader>
              <CardTitle>All Classes ({filteredClasses.length})</CardTitle>
              <CardDescription>
                Search, manage, and control all classes
              </CardDescription>
              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by class name, code, or creator..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {filteredClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{cls.name}</h3>
                          <Badge variant="outline">{cls.share_code}</Badge>
                          {cls.is_active ? (
                            <Badge className="bg-green-500">
                              <Activity className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {cls.member_count} members
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {cls.unit_count} units
                          </span>
                          <span className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            {cls.message_count} messages
                          </span>
                          <span className="text-xs">
                            Creator: {cls.creator_name}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Created: {new Date(cls.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedClass(cls);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {filteredClasses.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No classes found
                </p>
              )}
            </CardContent>
          </Card>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the class "<strong>{selectedClass?.name}</strong>" 
                  and all associated data (units, members, messages). This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteClass}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete Class
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </AppLayout>
    </AdminGuard>
  );
}

