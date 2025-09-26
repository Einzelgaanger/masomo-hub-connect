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
      // First try the full query with inner join
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          classes!inner(
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

      if (error) {
        console.log('Full profile query failed, trying simple query:', error);
        
        // Fallback to simple query without inner join
        const { data: simpleData, error: simpleError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (simpleError) throw simpleError;

        // If user has no class_id, set profile without class data
        if (!simpleData.class_id) {
          setProfile(simpleData);
          return;
        }

        // Fetch class data separately
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select(`
            *,
            universities(
              *,
              countries(*)
            ),
            units(*)
          `)
          .eq('id', simpleData.class_id)
          .single();

        if (classError) {
          console.error('Error fetching class data:', classError);
          // Set profile without class data if class fetch fails
          setProfile(simpleData);
          return;
        }

        setProfile({
          ...simpleData,
          classes: classData
        });
      } else {
        setProfile(data);
      }
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
