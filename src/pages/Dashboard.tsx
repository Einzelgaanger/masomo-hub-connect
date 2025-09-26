import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { WelcomeSection } from "@/components/dashboard/WelcomeSection";
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
      const { error: visitError } = await supabase
        .from('daily_visits')
        .upsert({
          user_id: user?.id,
          visit_date: new Date().toISOString().split('T')[0]
        }, {
          onConflict: 'user_id,visit_date'
        });

      if (visitError) {
        console.warn('Daily visits table not available:', visitError);
        return;
      }

      // Award points for daily visit
      const { error: pointsError } = await supabase.rpc('update_user_points', {
        user_uuid: user?.id,
        points_change: 2
      });

      if (pointsError) {
        console.warn('Points update not available:', pointsError);
      }
    } catch (error) {
      console.error('Error tracking daily visit:', error);
    }
  };

  return (
    <AppLayout>
      <WelcomeSection />
      <WallOfFameSection />
      <UpcomingSection />
    </AppLayout>
  );
};

export default Dashboard;