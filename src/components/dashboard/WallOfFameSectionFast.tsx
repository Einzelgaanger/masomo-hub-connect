import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, Building, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CHARACTERS } from "@/data/characters";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// Helper function to get character by points using new system
const getCharacterByPoints = (points: number) => {
  const availableCharacters = CHARACTERS
    .filter(char => {
      const pointsReq = char.unlockRequirements.find(req => req.type === 'points');
      return pointsReq ? points >= pointsReq.value : true;
    })
    .sort((a, b) => {
      const aPoints = a.unlockRequirements.find(req => req.type === 'points')?.value || 0;
      const bPoints = b.unlockRequirements.find(req => req.type === 'points')?.value || 0;
      return aPoints - bPoints;
    });
  
  return availableCharacters[availableCharacters.length - 1] || CHARACTERS[0];
};

export function WallOfFameSectionFast() {
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
      console.log('Fetching wall of fame data for mode:', viewMode);

      if (viewMode === 'university') {
        // Get user's class info first
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('class_id')
          .eq('user_id', user?.id)
          .single();

        if (profileError || !userProfile?.class_id) {
          console.log('No class found, switching to global view');
          setViewMode('global');
          return;
        }

        // Use materialized view for fast class-based query
        const { data: classUsers, error: classError } = await supabase
          .from('wall_of_fame_mv')
          .select('*')
          .eq('class_id', userProfile.class_id)
          .order('points', { ascending: false })
          .limit(30);

        if (classError) {
          console.warn('Materialized view query failed, trying fallback:', classError);
          
          // Fallback to regular profiles table
          const { data: fallbackUsers, error: fallbackError } = await supabase
            .from('profiles')
            .select('*')
            .eq('class_id', userProfile.class_id)
            .order('points', { ascending: false })
            .limit(30);

          if (fallbackError) {
            console.error('Fallback query also failed:', fallbackError);
            setViewMode('global');
            return;
          }

          setTopUsers(fallbackUsers || []);
        } else {
          setTopUsers(classUsers || []);
        }
      } else {
        // Global mode - use materialized view for fast global query
        const { data: globalUsers, error: globalError } = await supabase
          .from('wall_of_fame_mv')
          .select('*')
          .order('points', { ascending: false })
          .limit(30);

        if (globalError) {
          console.warn('Materialized view global query failed, trying fallback:', globalError);
          
          // Fallback to regular profiles table
          const { data: fallbackUsers, error: fallbackError } = await supabase
            .from('profiles')
            .select('*')
            .order('points', { ascending: false })
            .limit(30);

          if (fallbackError) {
            console.error('Fallback global query also failed:', fallbackError);
            setTopUsers([]);
          } else {
            setTopUsers(fallbackUsers || []);
          }
        } else {
          setTopUsers(globalUsers || []);
        }
      }
    } catch (error) {
      console.error('Error fetching wall of fame data:', error);
      setTopUsers([]);
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
      case 'master': return 'bg-purple-600';
      default: return 'bg-gray-400';
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (index === 1) return <Medal className="h-4 w-4 text-gray-400" />;
    if (index === 2) return <Award className="h-4 w-4 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground">#{index + 1}</span>;
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
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Wall of Fame
          </CardTitle>
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'university' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('university')}
              className="flex items-center gap-1"
            >
              <Building className="h-4 w-4" />
              University
            </Button>
            <Button
              variant={viewMode === 'global' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('global')}
              className="flex items-center gap-1"
            >
              <Globe className="h-4 w-4" />
              Global
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {topUsers.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {viewMode === 'university' 
                ? 'No university data available yet' 
                : 'No global data available yet'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {topUsers.map((profile, index) => (
              <div
                key={profile.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {getRankIcon(index)}
                </div>
                
                <div className="h-10 w-10 rounded-[20%] overflow-hidden flex-shrink-0">
                  {profile.profile_picture_url ? (
                    <img
                      src={profile.profile_picture_url}
                      alt={profile.full_name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {profile.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {profile.full_name || 'Unknown User'}
                    {profile.user_id === user?.id && (
                      <span className="text-primary text-xs ml-2">(You)</span>
                    )}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <Badge className={`text-xs w-fit ${getRankColor(profile.rank || 'bronze')} text-white`}>
                      {profile.rank || 'bronze'}
                    </Badge>
                    <div className="text-xs text-muted-foreground truncate">
                      {profile.class_name ? (
                        <>
                          <div>{profile.class_name}</div>
                          {profile.class_description && (
                            <div className="text-muted-foreground/80">
                              {profile.class_description}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground/70">
                          {viewMode === 'global' ? 'No class assigned' : 'Class not found'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {(() => {
                      const character = getCharacterByPoints(profile.points || 0);
                      return (
                        <span className="text-xs text-muted-foreground truncate">
                          {character?.name || 'Regular'} • {profile.points || 0} pts
                        </span>
                      );
                    })()}
                  </div>
                </div>
                
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-primary">
                    {profile.points || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">points</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
