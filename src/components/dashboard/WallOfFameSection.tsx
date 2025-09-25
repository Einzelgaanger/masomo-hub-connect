import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, Building, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getCharacterById } from "@/types/characters";

export function WallOfFameSection() {
  const { user } = useAuth();
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'university' | 'global'>('university');

  useEffect(() => {
    if (user) {
      fetchTopUsers();
    }
  }, [user, viewMode]);

  const fetchTopUsers = async () => {
    try {
      setLoading(true);

      if (viewMode === 'university') {
        // First get the current user's university
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select(`
            classes!inner(
              university_id
            )
          `)
          .eq('user_id', user?.id)
          .single();

        if (profileError || !userProfile) {
          console.error('Error fetching user profile:', profileError);
          return;
        }

        // Then get top users from the same university
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            *,
            classes!inner(
              course_name,
              course_year,
              semester,
              university_id,
              universities!inner(
                name,
                countries!inner(
                  name
                )
              )
            )
          `)
          .eq('classes.university_id', userProfile.classes.university_id)
          .order('points', { ascending: false })
          .limit(30);

        if (error) throw error;
        setTopUsers(data || []);
      } else {
        // Get top users globally
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            *,
            classes!inner(
              course_name,
              course_year,
              semester,
              university_id,
              universities!inner(
                name,
                countries!inner(
                  name
                )
              )
            )
          `)
          .order('points', { ascending: false })
          .limit(30);

        if (error) throw error;
        setTopUsers(data || []);
      }
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Wall of Fame
          </CardTitle>
          <div className="flex gap-1 w-full sm:w-auto">
            <Button
              variant={viewMode === 'university' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('university')}
              className="flex items-center gap-1 flex-1 sm:flex-none"
            >
              <Building className="h-3 w-3" />
              <span className="hidden xs:inline">My Uni</span>
              <span className="xs:hidden">Uni</span>
            </Button>
            <Button
              variant={viewMode === 'global' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('global')}
              className="flex items-center gap-1 flex-1 sm:flex-none"
            >
              <Globe className="h-3 w-3" />
              Global
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {topUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No rankings yet</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
            {topUsers.map((profile, index) => (
              <div 
                key={profile.id} 
                className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-colors ${
                  profile.user_id === user?.id 
                    ? 'bg-primary/10 border border-primary/20' 
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-center w-6 sm:w-8 flex-shrink-0">
                  {getRankIcon(index + 1)}
                </div>
                
                {/* Profile Picture and Character */}
                <div className="relative flex-shrink-0">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                    <AvatarImage src={profile.profile_picture_url} />
                    <AvatarFallback className="text-xs">
                      {profile.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Character beside profile picture */}
                  <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 bg-white rounded-full p-0.5 shadow-sm border border-gray-200">
                    {(() => {
                      const character = getCharacterById(profile.character_id || 'people');
                      return (
                        <img 
                          src={character?.image || '/characters/people.png'} 
                          alt={character?.name || 'Regular'}
                          className="w-3 h-3 sm:w-4 sm:h-4 object-contain"
                        />
                      );
                    })()}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs sm:text-sm truncate">
                    {profile.full_name}
                    {profile.user_id === user?.id && (
                      <span className="text-primary text-xs ml-1 sm:ml-2">(You)</span>
                    )}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <Badge className={`text-xs w-fit ${getRankColor(profile.rank)} text-white`}>
                      {profile.rank}
                    </Badge>
                    <span className="text-xs text-muted-foreground truncate">
                      {profile.classes?.course_name} - Year {profile.classes?.course_year}
                      {viewMode === 'global' && profile.classes?.universities?.name && (
                        <span className="block sm:inline sm:ml-1 text-xs text-muted-foreground">
                          <span className="sm:hidden">• </span>
                          {profile.classes.universities.name}
                          {profile.classes.universities.countries?.name && (
                            <span className="ml-1">
                              ({profile.classes.universities.countries.name})
                            </span>
                          )}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
                    {(() => {
                      const character = getCharacterById(profile.character_id || 'people');
                      return (
                        <span className="text-xs text-muted-foreground truncate">
                          {character?.name || 'Regular'}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-xs sm:text-sm">{profile.points}</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">points</p>
                  <p className="text-xs text-muted-foreground sm:hidden">pts</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}