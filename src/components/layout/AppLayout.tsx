import { useState, useEffect, createContext, useContext } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { ClientHeader } from "@/components/layout/ClientHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AppLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  HeaderComponent?: React.ComponentType<{ profile: any }>;
}

// Create context for profile data
const ProfileContext = createContext<any>(null);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within AppLayout');
  }
  return context;
};

export function AppLayout({ children, showHeader = false, HeaderComponent }: AppLayoutProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
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
        .eq('user_id', user.id)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ProfileContext.Provider value={profile}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <Sidebar profile={profile} />
          <main className="flex-1 flex flex-col">
            <ClientHeader />
            <div className="flex-1 p-4 lg:p-6 space-y-4 lg:space-y-6 overflow-auto">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </ProfileContext.Provider>
  );
}
