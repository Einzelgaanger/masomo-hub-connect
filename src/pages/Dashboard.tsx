import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { WelcomeSection } from "@/components/dashboard/WelcomeSection";
import { AnnouncementsSection } from "@/components/dashboard/AnnouncementsSection";
import { WallOfFameSection } from "@/components/dashboard/WallOfFameSection";
import { UpcomingSection } from "@/components/dashboard/UpcomingSection";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      trackDailyVisit();
    }
  }, [user]);

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

  return (
    <AppLayout>
      <WelcomeSection />
      <AnnouncementsSection />
      <WallOfFameSection />
      <UpcomingSection />
    </AppLayout>
  );
};

export default Dashboard;