import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminStatsSection } from "@/components/admin/AdminStatsSection";
import { ClassManagementSection } from "@/components/admin/ClassManagementSection";
import { StudentManagementSection } from "@/components/admin/StudentManagementSection";
import { ContentManagementSection } from "@/components/admin/ContentManagementSection";
import { SidebarProvider } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BookOpen, Upload, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if admin session exists
    const adminSession = sessionStorage.getItem('admin_session');
    if (!adminSession) {
      navigate('/admin-login');
      return;
    }
    
    // Create a mock admin profile
    setProfile({
      id: 'admin-1',
      full_name: 'System Administrator',
      email: 'admin@masomohub.com',
      role: 'super_admin',
      profile_picture_url: null,
      points: 0,
      rank: 'diamond'
    });
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar profile={profile} />
        <main className="flex-1 flex flex-col">
          <AdminHeader profile={profile} />
          <div className="flex-1 p-6 space-y-6 overflow-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Manage classes, students, and content for your university
              </p>
            </div>

            <AdminStatsSection />

            <Tabs defaultValue="classes" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="classes" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Classes
                </TabsTrigger>
                <TabsTrigger value="students" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Students
                </TabsTrigger>
                <TabsTrigger value="content" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="classes" className="space-y-6">
                <ClassManagementSection />
              </TabsContent>

              <TabsContent value="students" className="space-y-6">
                <StudentManagementSection />
              </TabsContent>

              <TabsContent value="content" className="space-y-6">
                <ContentManagementSection />
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Admin Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Admin settings and configuration options will be available here.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
