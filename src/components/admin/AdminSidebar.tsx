import { BookOpen, Upload, BarChart3, Users } from "lucide-react";
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
import Logo from "@/components/ui/Logo";

interface AdminSidebarProps {
  profile: any;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ profile }) => {
  const { collapsed } = useSidebar();

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";

  return (
    <SidebarComponent className={collapsed ? "w-16" : "w-64"}>
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-center">
          <Logo size={collapsed ? "md" : "lg"} showText={!collapsed} />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Panel</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/admin" className={getNavLinkClass}>
                    <BarChart3 className="h-5 w-5" />
                    {!collapsed && <span>Dashboard</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/admin/classes" className={getNavLinkClass}>
                    <BookOpen className="h-5 w-5" />
                    {!collapsed && <span>Classes</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/admin/content" className={getNavLinkClass}>
                    <Upload className="h-5 w-5" />
                    {!collapsed && <span>Content Management</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.profile_picture_url} alt={profile?.full_name} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
              <Badge variant="secondary" className="text-xs">
                {profile?.role}
              </Badge>
            </div>
          )}
        </div>
      </SidebarFooter>
    </SidebarComponent>
  );
};

export { AdminSidebar };
export default AdminSidebar;
