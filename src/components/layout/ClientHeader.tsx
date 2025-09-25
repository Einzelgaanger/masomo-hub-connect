import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useProfile } from "./AppLayout";
import BackButton from "@/components/ui/BackButton";

export function ClientHeader() {
  const profile = useProfile();

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      
      <BackButton fallbackPath="/dashboard" />
      
      <div className="flex-1" />
      
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {profile ? (
          <>
            <div className="text-right flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium whitespace-nowrap overflow-hidden">{profile.full_name}</p>
              <p className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden">{profile.email}</p>
            </div>
            
            <Avatar className="h-7 w-7 sm:h-8 lg:h-10 xl:h-12 sm:w-8 lg:w-10 xl:w-12 flex-shrink-0">
              <AvatarImage src={profile.profile_picture_url} />
              <AvatarFallback className="text-xs lg:text-sm">
                {profile.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
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
