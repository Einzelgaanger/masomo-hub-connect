import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { getCharacterByPoints } from "@/types/characters";

interface DashboardHeaderProps {
  profile: any;
}

export function DashboardHeader({ profile }: DashboardHeaderProps) {
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

  return (
    <header className="border-b bg-card h-16 flex items-center justify-between px-6">
      <SidebarTrigger className="md:hidden" />
      
      <div className="flex items-center gap-4 ml-auto">
        <div className="text-right">
          <p className="text-sm font-medium">{profile?.full_name}</p>
          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${getRankColor(profile?.rank)} text-white`}>
              {profile?.rank}
            </Badge>
            <span className="text-xs text-muted-foreground">{profile?.points} points</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <img 
              src={currentCharacter.image} 
              alt={currentCharacter.name}
              className="w-4 h-4 object-contain"
            />
            <span className="text-xs text-muted-foreground">{currentCharacter.name}</span>
          </div>
        </div>
        
        <Avatar className="h-10 w-10">
          <AvatarImage src={profile?.profile_picture_url} />
          <AvatarFallback>
            {profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}