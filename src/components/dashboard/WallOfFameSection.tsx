import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getCharacterById } from "@/types/characters";

export function WallOfFameSection() {
  const { user } = useAuth();
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTopUsers();
    }
  }, [user]);

  const fetchTopUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          classes!inner(
            universities!inner(
              id,
              name
            )
          )
        `)
        .order('points', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTopUsers(data || []);
    } catch (error) {
      console.error('Error fetching top users:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-amber-600" />;
      default: return <span className="text-sm font-bold text-muted-foreground">#{position}</span>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Wall of Fame
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-10 w-10 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-1/2 mb-1"></div>
                  <div className="h-3 bg-muted rounded w-1/4"></div>
                </div>
                <div className="h-4 bg-muted rounded w-12"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Wall of Fame
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No rankings yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topUsers.map((profile, index) => (
              <div 
                key={profile.id} 
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  profile.user_id === user?.id 
                    ? 'bg-primary/10 border border-primary/20' 
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(index + 1)}
                </div>
                
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile.profile_picture_url} />
                  <AvatarFallback>
                    {profile.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {profile.full_name}
                    {profile.user_id === user?.id && (
                      <span className="text-primary text-xs ml-2">(You)</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${getRankColor(profile.rank)} text-white`}>
                      {profile.rank}
                    </Badge>
                    <span className="text-xs text-muted-foreground truncate">
                      {profile.classes?.universities?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {(() => {
                      const character = getCharacterById(profile.character_id || 'people');
                      return (
                        <>
                          <img 
                            src={character?.image || '/characters/people.png'} 
                            alt={character?.name || 'Regular Person'}
                            className="w-3 h-3 object-contain"
                          />
                          <span className="text-xs text-muted-foreground truncate">
                            {character?.name || 'Regular Person'}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-sm">{profile.points}</p>
                  <p className="text-xs text-muted-foreground">points</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}