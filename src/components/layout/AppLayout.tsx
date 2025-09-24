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

// Create contexts for profile data and mobile sidebar state
const ProfileContext = createContext<any>(null);
const MobileSidebarContext = createContext<{
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
} | null>(null);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within AppLayout');
  }
  return context;
};

export const useMobileSidebar = () => {
  const context = useContext(MobileSidebarContext);
  if (!context) {
    throw new Error('useMobileSidebar must be used within AppLayout');
  }
  return context;
};

// Mobile Header Component - Simple hamburger menu
function MobileHeader({ profile }: { profile: any }) {
  const [isMobile, setIsMobile] = useState(false);
  const { sidebarOpen, setSidebarOpen } = useMobileSidebar();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // Use same breakpoint as Tailwind lg:
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (!isMobile) return null;

  return (
    <>
      {/* Mobile Header - Just hamburger menu */}
      <div className="lg:hidden flex items-center p-4 border-b bg-background sticky top-0 z-40">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 hover:text-gray-900"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}

export function AppLayout({ children, showHeader = false, HeaderComponent }: AppLayoutProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <MobileSidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-background">
            {/* Desktop Sidebar - Always visible on desktop */}
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
      </MobileSidebarContext.Provider>
    </ProfileContext.Provider>
  );
}
