import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ContentManagementSection } from "@/components/admin/ContentManagementSection";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";

const AdminContent = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if admin session exists
    const adminSession = sessionStorage.getItem('admin_session');
    if (!adminSession) {
      navigate('/admin/login');
      return;
    }
    
    // Create a mock admin profile
    setProfile({
      id: 'admin-1',
      full_name: 'System Administrator',
      email: 'admin@bunifu.com',
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
      <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
        <AdminSidebar profile={profile} />
        <main className="flex-1 flex flex-col overflow-x-hidden">
          <AdminHeader profile={profile} />
          <div className="flex-1 p-6 space-y-6 overflow-auto">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Upload className="h-6 w-6 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold">Content Management</h1>
              </div>
              <p className="text-muted-foreground">
                Manage announcements, assignments, events, and other content
              </p>
            </div>

            <ContentManagementSection />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminContent;
