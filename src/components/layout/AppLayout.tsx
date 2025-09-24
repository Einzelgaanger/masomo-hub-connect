import { useState, useEffect, createContext, useContext } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  HeaderComponent?: React.ComponentType<{ profile: any }>;
}

// Create a context for profile data
const ProfileContext = createContext<any>(null);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within AppLayout');
  }
  return context;
};

// Mobile Header Component
function MobileHeader({ profile }: { profile: any }) {
  const { state, setState } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) return null;

  return (
    <div className="lg:hidden flex items-center justify-between p-4 border-b bg-background sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setState(state === "collapsed" ? "expanded" : "collapsed")}
          className="p-2"
        >
          {state === "collapsed" ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span className="font-semibold text-lg">Bunifu</span>
        </div>
      </div>
      {profile && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium hidden sm:block">{profile.full_name?.split(' ')[0]}</span>
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-primary font-bold text-sm">
              {profile.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

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
          {/* Sidebar - Hidden on mobile by default */}
          <div className="hidden lg:block">
            <Sidebar profile={profile} />
          </div>
          
          {/* Mobile Sidebar - Shows when expanded on mobile */}
          <div className="lg:hidden">
            <Sidebar profile={profile} />
          </div>
          
          {/* Main Content */}
          <main className="flex-1 flex flex-col min-w-0">
            {/* Mobile Header - Always visible on mobile */}
            <MobileHeader profile={profile} />
            
            {/* Desktop Header - Only when showHeader is true */}
            {showHeader && HeaderComponent && (
              <div className="hidden lg:block">
                <HeaderComponent profile={profile} />
              </div>
            )}
            
            {/* Content Area */}
            <div className="flex-1 p-4 lg:p-6 space-y-4 lg:space-y-6 overflow-auto">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </ProfileContext.Provider>
  );
}
