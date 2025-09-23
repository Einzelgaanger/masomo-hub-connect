import { BookOpen, Settings, Info, User, GraduationCap, Shield } from "lucide-react";
import { NavLink } from "react-router-dom";
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

interface SidebarProps {
  profile: any;
}

export function Sidebar({ profile }: SidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

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

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";

  return (
    <SidebarComponent className={collapsed ? "w-16" : "w-64"}>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-sidebar-primary" />
          {!collapsed && (
            <span className="font-bold text-lg text-sidebar-primary">Masomo Hub</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard" className={getNavLinkClass}>
                    <User className="h-4 w-4" />
                    {!collapsed && <span>Dashboard</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {profile && ['admin', 'super_admin'].includes(profile.role) && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin" className={getNavLinkClass}>
                      <Shield className="h-4 w-4" />
                      {!collapsed && <span>Admin Panel</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {profile?.classes?.units && (
          <SidebarGroup>
            <SidebarGroupLabel>Units</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {profile.classes.units.map((unit: any) => (
                  <SidebarMenuItem key={unit.id}>
                    <SidebarMenuButton asChild>
                      <NavLink to={`/unit/${unit.id}`} className={getNavLinkClass}>
                        <BookOpen className="h-4 w-4" />
                        {!collapsed && <span>{unit.name}</span>}
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
                  <NavLink to="/settings" className={getNavLinkClass}>
                    <Settings className="h-4 w-4" />
                    {!collapsed && <span>Settings</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/info" className={getNavLinkClass}>
                    <Info className="h-4 w-4" />
                    {!collapsed && <span>Info</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`text-xs ${getRankColor(profile.rank)} text-white`}>
                    {profile.rank}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{profile.points} pts</span>
                </div>
              </div>
            )}
          </div>
        </SidebarFooter>
      )}
    </SidebarComponent>
  );
}