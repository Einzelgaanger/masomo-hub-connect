import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { WelcomeSection } from "@/components/dashboard/WelcomeSection";
import { AnnouncementsSection } from "@/components/dashboard/AnnouncementsSection";
import { WallOfFameSection } from "@/components/dashboard/WallOfFameSection";
import { UpcomingSection } from "@/components/dashboard/UpcomingSection";
import { SidebarProvider } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
      trackDailyVisit();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          classes(
            *,
            universities(
              *,
              countries(*)
            ),
            units(*)
          )
        `)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const trackDailyVisit = async () => {
    try {
      await supabase
        .from('daily_visits')
        .upsert({
          user_id: user?.id,
          visit_date: new Date().toISOString().split('T')[0]
        }, {
          onConflict: 'user_id,visit_date'
        });

      // Award points for daily visit
      await supabase.rpc('update_user_points', {
        user_uuid: user?.id,
        points_change: 5
      });
    } catch (error) {
      console.error('Error tracking daily visit:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar profile={profile} />
        <main className="flex-1 flex flex-col">
          <DashboardHeader profile={profile} />
          <div className="flex-1 p-6 space-y-6 overflow-auto">
            <WelcomeSection profile={profile} />
            <AnnouncementsSection />
            <WallOfFameSection />
            <UpcomingSection />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;