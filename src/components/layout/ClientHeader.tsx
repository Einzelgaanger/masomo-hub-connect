import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ProfilePictureModal } from "@/components/ui/ProfilePictureModal";
import { useProfile } from "./AppLayout";
import BackButton from "@/components/ui/BackButton";
import { useLocation } from "react-router-dom";
import { Award, Users, Calendar, Briefcase, MessageSquare, BookOpen, GraduationCap, User } from "lucide-react";

export function ClientHeader() {
  const profile = useProfile();
  const location = useLocation();

  // Map paths to tab names and icons
  const getTabInfo = (pathname: string) => {
    const pathMap: Record<string, { name: string; icon: React.ReactNode }> = {
      '/dashboard': { name: 'Dashboard', icon: <BookOpen className="h-4 w-4" /> },
      '/ukumbi': { name: 'Ukumbi', icon: <Users className="h-4 w-4" /> },
      '/events': { name: 'Tukio', icon: <Calendar className="h-4 w-4" /> },
      '/ajira': { name: 'Ajira', icon: <Briefcase className="h-4 w-4" /> },
      '/inbox': { name: 'Inbox', icon: <MessageSquare className="h-4 w-4" /> },
      '/units': { name: 'Units', icon: <BookOpen className="h-4 w-4" /> },
      '/alumni': { name: 'Alumni', icon: <GraduationCap className="h-4 w-4" /> },
      '/sifa': { name: 'Sifa', icon: <Award className="h-4 w-4" /> },
    };

    // Check for profile routes
    if (pathname.startsWith('/profile/')) {
      return { name: 'Profile', icon: <User className="h-4 w-4" /> };
    }

    return pathMap[pathname] || { name: 'Masomo Hub', icon: <BookOpen className="h-4 w-4" /> };
  };

  const currentTab = getTabInfo(location.pathname);

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      {/* Current Tab Name and Icon */}
      <div className="flex items-center gap-2 text-base font-semibold">
        <span>{currentTab.name}</span>
        <div className="scale-110">
          {currentTab.icon}
        </div>
      </div>
      
      <div className="flex-1" />
      
      <BackButton fallbackPath="/dashboard" className="h-8 w-8 p-1" />
      
      <SidebarTrigger className="-ml-1 h-8 w-8 p-1" />
      
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {profile ? (
          <>
            <div className="text-right flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium whitespace-nowrap overflow-hidden">{profile.full_name}</p>
              <p className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden">{profile.email}</p>
            </div>
            
            <ProfilePictureModal
              src={profile.profile_picture_url}
              fallback={profile.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
              alt={profile.full_name}
              className="h-7 w-7 sm:h-8 lg:h-10 xl:h-12 sm:w-8 lg:w-10 xl:w-12 flex-shrink-0"
            />
          </>
        ) : (
          <>
            <div className="text-right flex-1 min-w-0">
              <div className="h-3 sm:h-4 bg-muted rounded animate-pulse mb-1 w-16 sm:w-24"></div>
              <div className="h-2 sm:h-3 bg-muted rounded animate-pulse w-12 sm:w-20"></div>
            </div>
            
            <div className="h-7 w-7 sm:h-8 lg:h-10 xl:h-12 sm:w-8 lg:w-10 xl:w-12 bg-muted rounded-full animate-pulse flex-shrink-0"></div>
          </>
        )}
      </div>
    </header>
  );
}
