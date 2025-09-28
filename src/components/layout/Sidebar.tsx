import { BookOpen, Info, User, GraduationCap, Shield, LogOut, Video, UserCircle, MessageCircle, Calendar, Briefcase, Mail, GraduationCap as MasomoIcon, Users } from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ProfilePictureModal } from "@/components/ui/ProfilePictureModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationBadge } from "@/components/ui/NotificationBadge";

interface SidebarProps {
  profile: any;
}

export function Sidebar({ profile }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { notifications } = useNotifications();
  const { setOpenMobile } = useSidebar();

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";

  const handleNavClick = (path: string) => {
    // If clicking on the same page, close the sidebar
    if (location.pathname === path) {
      setOpenMobile(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear all storage immediately
      localStorage.clear();
      sessionStorage.clear();
      
      // Try multiple logout methods for OAuth
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (e) {
        console.log('Global logout failed, trying local:', e);
        try {
          await supabase.auth.signOut();
        } catch (e2) {
          console.log('Local logout also failed:', e2);
        }
      }
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      
      // Force complete page reload to clear all state
      setTimeout(() => {
        window.location.replace('/');
      }, 100);
      
    } catch (error) {
      console.error('Error logging out:', error);
      
      // Clear everything and force reload
      localStorage.clear();
      sessionStorage.clear();
      
      toast({
        title: "Logged Out",
        description: "You have been logged out.",
      });
      
      // Force complete page reload
      setTimeout(() => {
        window.location.replace('/');
      }, 100);
    }
  };

  return (
    <SidebarComponent className="w-64 overflow-hidden">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-center">
          <Logo size="lg" showText={true} />
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-col h-full overflow-hidden">
        {/* Main Navigation Section */}
        <div className="flex-1 overflow-hidden">
          <SidebarGroup>
            <SidebarGroupContent className="overflow-hidden">
              <SidebarMenu className="space-y-1">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/dashboard" 
                      className={getNavLinkClass}
                      onClick={() => handleNavClick("/dashboard")}
                    >
                      <User className="h-4 w-4" />
                      <span>Dashboard</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/units" 
                      className={getNavLinkClass}
                      onClick={() => handleNavClick("/units")}
                    >
                      <div className="relative">
                        <MasomoIcon className="h-4 w-4" />
                        <NotificationBadge 
                          count={notifications.masomo} 
                          onClick={() => navigate('/units')}
                        />
                      </div>
                      <span>Masomo</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/ukumbi" 
                      className={getNavLinkClass}
                      onClick={() => handleNavClick("/ukumbi")}
                    >
                      <div className="relative">
                        <MessageCircle className="h-4 w-4" />
                        <NotificationBadge 
                          count={notifications.ukumbi} 
                          onClick={() => navigate('/ukumbi')}
                        />
                      </div>
                      <span>Ukumbi</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/events" 
                      className={getNavLinkClass}
                      onClick={() => handleNavClick("/events")}
                    >
                      <div className="relative">
                        <Calendar className="h-4 w-4" />
                        <NotificationBadge 
                          count={notifications.tukio} 
                          onClick={() => navigate('/events')}
                        />
                      </div>
                      <span>Tukio</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/ajira" 
                      className={getNavLinkClass}
                      onClick={() => handleNavClick("/ajira")}
                    >
                      <div className="relative">
                        <Briefcase className="h-4 w-4" />
                        <NotificationBadge 
                          count={notifications.ajira} 
                          onClick={() => navigate('/ajira')}
                        />
                      </div>
                      <span>Ajira</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/inbox" 
                      className={getNavLinkClass}
                      onClick={() => handleNavClick("/inbox")}
                    >
                      <div className="relative">
                        <Mail className="h-4 w-4" />
                        <NotificationBadge 
                          count={notifications.inbox} 
                          onClick={() => navigate('/inbox')}
                        />
                      </div>
                      <span>Inbox</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/alumni" 
                      className={getNavLinkClass}
                      onClick={() => handleNavClick("/alumni")}
                    >
                      <div className="relative">
                        <Users className="h-4 w-4" />
                        <NotificationBadge 
                          count={notifications.alumni} 
                          onClick={() => navigate('/alumni')}
                        />
                      </div>
                      <span>Alumni</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {profile && ['admin', 'super_admin'].includes(profile.role) && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to="/admin" 
                        className={getNavLinkClass}
                        onClick={() => handleNavClick("/admin")}
                      >
                        <Shield className="h-4 w-4" />
                        <span>Admin Panel</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={`/profile/${profile?.user_id}`} 
                      className={getNavLinkClass}
                      onClick={() => handleNavClick(`/profile/${profile?.user_id}`)}
                    >
                      <UserCircle className="h-4 w-4" />
                      <span>My Profile</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/info" 
                      className={getNavLinkClass}
                      onClick={() => handleNavClick("/info")}
                    >
                      <Info className="h-4 w-4" />
                      <span>Info</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        {/* Bottom Section - Logout button right above profile */}
        <div className="flex-shrink-0">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {profile ? (
          <div className="flex items-center gap-3">
            <ProfilePictureModal
              src={profile.profile_picture_url}
              fallback={profile.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
              alt={profile.full_name}
              className="h-10 w-10"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-muted rounded-full animate-pulse"></div>
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-muted rounded animate-pulse mb-1"></div>
              <div className="h-3 bg-muted rounded animate-pulse w-3/4"></div>
            </div>
          </div>
        )}
      </SidebarFooter>
      </SidebarComponent>
  );
}