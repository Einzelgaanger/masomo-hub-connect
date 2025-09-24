import { BookOpen, Settings, Info, User, GraduationCap, Shield, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/Logo";
import { getCharacterByPoints } from "@/types/characters";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMobileSidebar } from "./AppLayout";

interface SidebarProps {
  profile: any;
}

export function Sidebar({ profile }: SidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { toast } = useToast();
  const { sidebarOpen, setSidebarOpen } = useMobileSidebar();

  // Mobile responsiveness - use same breakpoint as AppLayout
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'bronze': return 'bg-amber-600';
      case 'silver': return 'bg-gray-400';
      case 'gold': return 'bg-yellow-500';
      case 'platinum': return 'bg-gray-700';
      case 'diamond': return 'bg-cyan-500';
      default: return 'bg-gray-400';
    }
  };

  const currentCharacter = getCharacterByPoints(profile?.points || 0);

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";

  const handleNavClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <SidebarComponent 
      className={`${
        isMobile 
          ? (sidebarOpen ? "w-64 translate-x-0 opacity-100" : "w-64 -translate-x-full opacity-0") 
          : (collapsed ? "w-16" : "w-64")
      } transition-all duration-300 ease-in-out ${
        isMobile ? "fixed inset-y-0 left-0 z-50 bg-background border-r shadow-lg" : ""
      }`}
    >
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-center">
          <Logo size={collapsed && !isMobile ? "md" : "lg"} showText={!collapsed || isMobile} />
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-col h-full">
        <div className="flex-1 overflow-hidden">
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard" className={getNavLinkClass} onClick={handleNavClick}>
                    <User className="h-4 w-4" />
                    {(!collapsed || isMobile) && <span>Dashboard</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {profile && ['admin', 'super_admin'].includes(profile.role) && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin" className={getNavLinkClass} onClick={handleNavClick}>
                      <Shield className="h-4 w-4" />
                      {(!collapsed || isMobile) && <span>Admin Panel</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {profile?.classes?.units && (
            <SidebarGroup className="flex-1 min-h-0">
              <SidebarGroupLabel>Units</SidebarGroupLabel>
              <SidebarGroupContent className="max-h-48 overflow-y-auto">
                <SidebarMenu>
                {profile.classes.units.map((unit: any) => (
                  <SidebarMenuItem key={unit.id}>
                    <SidebarMenuButton asChild>
                      <NavLink to={`/unit/${unit.id}`} className={getNavLinkClass} onClick={handleNavClick}>
                        <BookOpen className="h-4 w-4" />
                        {(!collapsed || isMobile) && <span className="truncate">{unit.name}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/settings" className={getNavLinkClass} onClick={handleNavClick}>
                    <Settings className="h-4 w-4" />
                    {(!collapsed || isMobile) && <span>Settings</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/info" className={getNavLinkClass} onClick={handleNavClick}>
                    <Info className="h-4 w-4" />
                    {(!collapsed || isMobile) && <span>Info</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        {/* Logout Section - Always visible at bottom */}
        <div className="border-t border-sidebar-border">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  {(!collapsed || isMobile) && <span>Logout</span>}
                </Button>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>

      {profile && (
        <SidebarFooter className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile.profile_picture_url} />
              <AvatarFallback>
                {profile.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {(!collapsed || isMobile) && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
              </div>
            )}
          </div>
        </SidebarFooter>
      )}
      </SidebarComponent>
  );
}