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
  if (context === undefined) {
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
    } else {
      // User logged out, clear profile and set loading to false
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      // Use simple query to avoid complex join issues
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setProfile(null);
        return;
      }

      // If user has no class_id, set profile without class data
      if (!profileData.class_id) {
        setProfile(profileData);
        return;
      }

      // Try to fetch class data separately (optional)
      try {
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select(`
            *,
            universities(
              *,
              countries(*)
            )
          `)
          .eq('id', profileData.class_id)
          .single();

        if (classError) {
          console.warn('Error fetching class data:', classError);
          // Set profile without class data if class fetch fails
          setProfile(profileData);
        } else {
          // Combine profile and class data
          setProfile({
            ...profileData,
            classes: classData
          });
        }
      } catch (classError) {
        console.warn('Error fetching class data:', classError);
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
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
        <div className="h-screen flex w-full bg-background overflow-hidden">
          <Sidebar profile={profile} />
          <main className="flex-1 flex flex-col overflow-hidden">
            <ClientHeader />
            <div className="flex-1 p-4 lg:p-6 space-y-4 lg:space-y-6 overflow-y-auto overflow-x-hidden">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </ProfileContext.Provider>
  );
}
