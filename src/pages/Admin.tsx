import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Building, 
  BookOpen, 
  Globe, 
  BarChart3, 
  Settings,
  Shield,
  AlertTriangle,
  UserCheck,
  UserX,
  Crown,
  Database,
  Activity,
  MessageSquare,
  FileText,
  Trash2,
  Edit,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Award,
  Calendar,
  Bell
} from "lucide-react";
import UniversityManagement from "@/components/admin/UniversityManagement";
import ClassManagement from "@/components/admin/ClassManagement";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";

interface AdminStats {
  total_users: number;
  total_classes: number;
  total_join_requests: number;
  pending_requests: number;
  total_countries: number;
  total_universities: number;
  total_courses: number;
  active_users_today: number;
  total_achievements: number;
  total_uploads: number;
  total_messages: number;
  approved_requests: number;
  rejected_requests: number;
  total_visits: number;
  active_today_count: number;
}

interface User {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  last_login?: string;
  points: number;
  rank: string;
  profile_completed: boolean;
  country_id?: string;
  university_id?: string;
  course_id?: string;
}

interface SystemActivity {
  id: string;
  type: string;
  description: string;
  created_at: string;
  user_name?: string;
}

const Admin = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<SystemActivity[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [usersLoading, setUsersLoading] = useState(false);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  useEffect(() => {
    if (user && !authChecked) {
      checkAdminStatus();
    } else if (!user) {
      setLoading(false);
      setIsAdmin(false);
      setAuthChecked(true);
    }
  }, [user, authChecked]);

  const checkAdminStatus = async () => {
    try {
      setLoading(true);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const isAdminUser = profile?.role === 'super_admin' || profile?.role === 'admin';
      setIsAdmin(isAdminUser);
      
      // Only fetch stats if user is admin
      if (isAdminUser) {
        await fetchStats();
        await fetchActivities();
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  };

  const fetchStats = async () => {
    try {
      
      // Get current timestamp for 24-hour calculation
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Fetch comprehensive counts
      const [
        { count: usersCount },
        { count: classesCount },
        { count: joinRequestsCount },
        { count: pendingRequestsCount },
        { count: approvedRequestsCount },
        { count: rejectedRequestsCount },
        { count: countriesCount },
        { count: universitiesCount },
        { count: coursesCount },
        { count: achievementsCount },
        { count: uploadsCount },
        { count: messagesCount },
        { count: totalVisitsCount },
        activeTodayResult
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('classes').select('*', { count: 'exact', head: true }),
        supabase.from('class_join_requests').select('*', { count: 'exact', head: true }),
        supabase.from('class_join_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('class_join_requests').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('class_join_requests').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
        supabase.from('countries').select('*', { count: 'exact', head: true }),
        supabase.from('universities').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('achievements').select('*', { count: 'exact', head: true }),
        supabase.from('uploads').select('*', { count: 'exact', head: true }),
        supabase.from('class_chat_messages').select('*', { count: 'exact', head: true }),
        supabase.from('daily_visits').select('*', { count: 'exact', head: true }),
        supabase.from('daily_visits')
          .select('user_id')
          .gte('visit_date', twentyFourHoursAgo)
          .then(result => ({
            data: result.data || [],
            uniqueUsers: new Set(result.data?.map(visit => visit.user_id).filter(Boolean) || []).size
          }))
      ]);

      // Get active users today from daily_visits table
      const today = new Date().toISOString().split('T')[0];
      const { count: activeUsersToday } = await supabase
        .from('daily_visits')
        .select('*', { count: 'exact', head: true })
        .eq('visit_date', today);

      setStats({
        total_users: usersCount || 0,
        total_classes: classesCount || 0,
        total_join_requests: joinRequestsCount || 0,
        pending_requests: pendingRequestsCount || 0,
        approved_requests: approvedRequestsCount || 0,
        rejected_requests: rejectedRequestsCount || 0,
        total_countries: countriesCount || 0,
        total_universities: universitiesCount || 0,
        total_courses: coursesCount || 0,
        active_users_today: activeTodayResult.uniqueUsers || 0,
        total_achievements: achievementsCount || 0,
        total_uploads: uploadsCount || 0,
        total_messages: messagesCount || 0,
        total_visits: totalVisitsCount || 0,
        active_today_count: activeTodayResult.uniqueUsers || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Error",
        description: "Failed to load admin statistics.",
        variant: "destructive",
      });
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          full_name,
          email,
          role,
          created_at,
          last_login,
          points,
          rank,
          profile_completed,
          country_id,
          university_id,
          course_id
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      });
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      setActivitiesLoading(true);
      const activities: SystemActivity[] = [];

      // Fetch recent user registrations
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentUsers) {
        recentUsers.forEach((user, index) => {
          activities.push({
            id: `user_${index}`,
            type: 'user_registered',
            description: 'New user registered',
            created_at: user.created_at,
            user_name: user.full_name || 'Unknown User'
          });
        });
      }

      // Fetch recent class creations
      const { data: recentClasses } = await supabase
        .from('classes')
        .select('name, created_at, creator_id')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentClasses) {
        // Get creator names
        const creatorIds = recentClasses.map(c => c.creator_id);
        const { data: creators } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', creatorIds);

        recentClasses.forEach((classItem, index) => {
          const creator = creators?.find(c => c.user_id === classItem.creator_id);
          activities.push({
            id: `class_${index}`,
            type: 'class_created',
            description: `New class created: ${classItem.name}`,
            created_at: classItem.created_at,
            user_name: creator?.full_name || 'Unknown Creator'
          });
        });
      }

      // Fetch recent join requests
      const { data: recentRequests } = await supabase
        .from('class_join_requests')
        .select('requested_at, user_id, status')
        .order('requested_at', { ascending: false })
        .limit(3);

      if (recentRequests) {
        recentRequests.forEach((request, index) => {
          activities.push({
            id: `request_${index}`,
            type: 'join_request',
            description: `Class join request ${request.status}`,
            created_at: request.requested_at,
            user_name: 'User'
          });
        });
      }

      // Sort all activities by date
      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setActivities(activities.slice(0, 10)); // Show only latest 10
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User role updated successfully.",
      });

      fetchUsers(); // Refresh users list
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/admin/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to logout.",
        variant: "destructive",
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
            <Button 
              onClick={() => navigate('/admin/login')} 
              className="mt-4"
            >
              Go to Admin Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Masomo Hub Connect</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Shield className="h-3 w-3 mr-1" />
                Admin Access
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">

        {/* Enhanced Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="text-xl font-bold">{stats?.total_users || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <UserCheck className="h-6 w-6 text-emerald-600" />
                <div>
                  <p className="text-xl font-bold">{stats?.active_users_today || 0}</p>
                  <p className="text-xs text-muted-foreground">Active Today</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Building className="h-6 w-6 text-green-600" />
                <div>
                  <p className="text-xl font-bold">{stats?.total_classes || 0}</p>
                  <p className="text-xs text-muted-foreground">Active Classes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-orange-600" />
                <div>
                  <p className="text-xl font-bold">{stats?.pending_requests || 0}</p>
                  <p className="text-xs text-muted-foreground">Pending Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Award className="h-6 w-6 text-purple-600" />
                <div>
                  <p className="text-xl font-bold">{stats?.total_achievements || 0}</p>
                  <p className="text-xs text-muted-foreground">Achievements</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-indigo-600" />
                <div>
                  <p className="text-xl font-bold">{stats?.total_uploads || 0}</p>
                  <p className="text-xs text-muted-foreground">Uploads</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-6 w-6 text-pink-600" />
                <div>
                  <p className="text-xl font-bold">{stats?.total_messages || 0}</p>
                  <p className="text-xs text-muted-foreground">Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comprehensive Management Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="classes" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Classes
            </TabsTrigger>
            <TabsTrigger value="universities" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Universities
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Enhanced Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Database</span>
                    <Badge className="bg-green-100 text-green-800">Online</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Authentication</span>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">File Storage</span>
                    <Badge className="bg-green-100 text-green-800">Available</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Real-time</span>
                    <Badge className="bg-green-100 text-green-800">Connected</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Request Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Join Requests
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending</span>
                    <Badge variant="outline" className="text-orange-600">{stats?.pending_requests || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Approved</span>
                    <Badge variant="outline" className="text-green-600">{stats?.approved_requests || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Rejected</span>
                    <Badge variant="outline" className="text-red-600">{stats?.rejected_requests || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total</span>
                    <Badge variant="outline">{stats?.total_join_requests || 0}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-purple-600" />
                    Platform Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Countries</span>
                    <Badge variant="outline">{stats?.total_countries || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Universities</span>
                    <Badge variant="outline">{stats?.total_universities || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Courses</span>
                    <Badge variant="outline">{stats?.total_courses || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Classes</span>
                    <Badge variant="outline">{stats?.total_classes || 0}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent System Activity
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={fetchActivities}
                    disabled={activitiesLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${activitiesLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading activities...</p>
                  </div>
                ) : activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Activity className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {activity.user_name} • {new Date(activity.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{activity.type}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No recent activities</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Dashboard Tab */}
          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Management
                  </div>
                  <Button onClick={fetchUsers} disabled={usersLoading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${usersLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search and Filter */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search users by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="student">Students</SelectItem>
                      <SelectItem value="alumni">Alumni</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                      <SelectItem value="super_admin">Super Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Users Table */}
                {usersLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading users...</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-3 font-medium">User</th>
                            <th className="text-left p-3 font-medium">Role</th>
                            <th className="text-left p-3 font-medium">Points</th>
                            <th className="text-left p-3 font-medium">Profile</th>
                            <th className="text-left p-3 font-medium">Joined</th>
                            <th className="text-left p-3 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((user) => (
                            <tr key={user.id} className="border-t hover:bg-muted/50">
                              <td className="p-3">
                                <div>
                                  <p className="font-medium">{user.full_name}</p>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                              </td>
                              <td className="p-3">
                                <Badge 
                                  variant={user.role === 'super_admin' ? 'default' : 
                                          user.role === 'admin' ? 'secondary' : 'outline'}
                                >
                                  {user.role}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Award className="h-4 w-4 text-yellow-600" />
                                  <span>{user.points}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {user.rank}
                                  </Badge>
                                </div>
                              </td>
                              <td className="p-3">
                                <Badge 
                                  variant={user.profile_completed ? "default" : "destructive"}
                                >
                                  {user.profile_completed ? (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Complete
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Incomplete
                                    </>
                                  )}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <span className="text-sm text-muted-foreground">
                                  {new Date(user.created_at).toLocaleDateString()}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex gap-2">
                                  <Select 
                                    value={user.role} 
                                    onValueChange={(newRole) => updateUserRole(user.user_id, newRole)}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="student">Student</SelectItem>
                                      <SelectItem value="alumni">Alumni</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                      <SelectItem value="super_admin">Super Admin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button size="sm" variant="outline">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {filteredUsers.length === 0 && (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No users found</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Universities Tab */}
          <TabsContent value="universities">
            <UniversityManagement />
          </TabsContent>

          {/* Classes Tab */}
          <TabsContent value="classes">
            <ClassManagement />
          </TabsContent>

          {/* Content Management Tab */}
          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Achievements Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Achievements</span>
                    <Badge variant="outline">{stats?.total_achievements || 0}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      View All
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Moderate
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Uploads Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    File Uploads
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Uploads</span>
                    <Badge variant="outline">{stats?.total_uploads || 0}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      View All
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clean Up
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Messages Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Chat Messages
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Messages</span>
                    <Badge variant="outline">{stats?.total_messages || 0}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Monitor
                    </Button>
                    <Button size="sm" variant="outline">
                      <Ban className="h-4 w-4 mr-2" />
                      Moderate
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* System Maintenance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    System Maintenance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Button size="sm" variant="outline" className="w-full">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Clear Cache
                    </Button>
                    <Button size="sm" variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                    <Button size="sm" variant="outline" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Enhanced Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Platform Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Platform Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="platform-name">Platform Name</Label>
                      <Input id="platform-name" defaultValue="Masomo Hub Connect" />
                    </div>
                    <div>
                      <Label htmlFor="platform-description">Description</Label>
                      <Textarea 
                        id="platform-description" 
                        defaultValue="Academic collaboration platform for students"
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="maintenance-mode" />
                      <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                    </div>
                  </div>
                  <Button>Save Settings</Button>
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="require-email-verification" defaultChecked />
                      <Label htmlFor="require-email-verification">Require Email Verification</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="auto-approve-classes" />
                      <Label htmlFor="auto-approve-classes">Auto-approve Class Requests</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="enable-file-uploads" defaultChecked />
                      <Label htmlFor="enable-file-uploads">Enable File Uploads</Label>
                    </div>
                    <div>
                      <Label htmlFor="max-file-size">Max File Size (MB)</Label>
                      <Input id="max-file-size" type="number" defaultValue="10" />
                    </div>
                  </div>
                  <Button>Update Security</Button>
                </CardContent>
              </Card>

              {/* Notification Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="email-notifications" defaultChecked />
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="push-notifications" />
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="admin-alerts" defaultChecked />
                      <Label htmlFor="admin-alerts">Admin Alerts</Label>
                    </div>
                  </div>
                  <Button>Save Preferences</Button>
                </CardContent>
              </Card>

              {/* Database Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Button size="sm" variant="outline" className="w-full">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Optimize Database
                    </Button>
                    <Button size="sm" variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Backup Database
                    </Button>
                    <Button size="sm" variant="destructive" className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clean Old Data
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ⚠️ Database operations should be performed with caution
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Admin;
