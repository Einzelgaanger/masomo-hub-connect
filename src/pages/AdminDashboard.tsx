import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminDashboardStats } from "@/components/admin/AdminDashboardStats";
import { SidebarProvider } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the actual admin profile from the database
    const fetchAdminProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/admin/login');
          return;
        }

        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error || !profileData) {
          console.error('Error fetching admin profile:', error);
          navigate('/admin/login');
          return;
        }

        setProfile(profileData);
      } catch (error) {
        console.error('Error in fetchAdminProfile:', error);
        navigate('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminProfile();
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
                <div className="p-2 bg-blue-50 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              </div>
              <p className="text-muted-foreground">
                System overview and key metrics for your Bunifu platform
              </p>
            </div>

            <AdminDashboardStats />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
