import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, Building, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CHARACTERS } from "@/data/characters";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// Helper function to get character by points using new system
const getCharacterByPoints = (points: number) => {
  // Sort characters by points required and find the highest one the user can unlock
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
        // First get the current user's university with fallback
        // Use simple query to avoid inner join issues
        const { data: simpleProfile, error: simpleError } = await supabase
          .from('profiles')
          .select('class_id')
          .eq('user_id', user?.id)
          .single();

        if (simpleError || !simpleProfile) {
          console.error('Error fetching user profile:', simpleError);
          return;
        }

        if (!simpleProfile.class_id) {
          console.log('User has no class_id, showing global wall of fame');
          // Switch to global view if user has no class
          setViewMode('global');
          return;
        }

        // Get university_id from class_id
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('university_id')
          .eq('id', simpleProfile.class_id)
          .single();

        if (classError || !classData) {
          console.error('Error fetching class data:', classError);
          return;
        }

        // Use simplified query to avoid inner join issues
        const { data: simpleData, error: simpleDataError } = await supabase
          .from('profiles')
          .select('*')
          .eq('class_id', simpleProfile.class_id)
          .order('points', { ascending: false })
          .limit(30);

        if (simpleDataError) throw simpleDataError;

        // Manually fetch class and university data for each profile
        const profilesWithClasses = await Promise.all(
          (simpleData || []).map(async (profile) => {
            if (!profile.class_id) {
              console.log('Profile has no class_id:', profile.id, profile.full_name);
              return { ...profile, classes: null };
            }

            const { data: classInfo, error: classError } = await supabase
              .from('classes')
              .select(`
                course_name,
                course_year,
                semester,
                university_id,
                universities(
                  name,
                  countries(name)
                )
              `)
              .eq('id', profile.class_id)
              .single();

            if (classError) {
              console.warn('Error fetching class info for profile:', profile.id, classError);
            }

            return { ...profile, classes: classInfo };
          })
        );

        setTopUsers(profilesWithClasses);
      } else {
        // Global mode - use simplified query
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('points', { ascending: false })
          .limit(30);

        if (error) {
          console.warn('Full global query failed, trying simplified query:', error);
          const { data: simpleData, error: simpleDataError2 } = await supabase
            .from('profiles')
            .select('*')
            .order('points', { ascending: false })
            .limit(30);

          if (simpleDataError2) throw simpleDataError2;

          // Manually fetch class and university data for each profile
          const profilesWithClasses = await Promise.all(
            (simpleData || []).map(async (profile) => {
              if (!profile.class_id) {
                console.log('Global profile has no class_id:', profile.id, profile.full_name);
                return { ...profile, classes: null };
              }
              
              const { data: classInfo, error: classError } = await supabase
                .from('classes')
                .select(`
                  course_name,
                  course_year,
                  semester,
                  university_id,
                  universities(
                    name,
                    countries(name)
                  )
                `)
                .eq('id', profile.class_id)
                .single();

              if (classError) {
                console.warn('Error fetching class info for global profile:', profile.id, classError);
              }

              return { ...profile, classes: classInfo };
            })
          );

          setTopUsers(profilesWithClasses);
        } else {
          // Manually fetch class and university data for each profile
          const profilesWithClasses = await Promise.all(
            (data || []).map(async (profile) => {
              if (!profile.class_id) {
                console.log('Global profile has no class_id:', profile.id, profile.full_name);
                return { ...profile, classes: null };
              }
              
              const { data: classInfo, error: classError } = await supabase
                .from('classes')
                .select(`
                  course_name,
                  course_year,
                  semester,
                  university_id,
                  universities(
                    name,
                    countries(name)
                  )
                `)
                .eq('id', profile.class_id)
                .single();

              if (classError) {
                console.warn('Error fetching class info for global profile:', profile.id, classError);
              }

              return { ...profile, classes: classInfo };
            })
          );

          setTopUsers(profilesWithClasses);
        }
      }
    } catch (error) {
      console.error('Error fetching top users:', error);
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

  // Debug logging
  useEffect(() => {
    if (topUsers.length > 0) {
      console.log('WallOfFameSection Data:', {
        userCount: topUsers.length,
        viewMode,
        sampleUsers: topUsers.slice(0, 3).map(user => ({
          id: user.id,
          name: user.full_name,
          points: user.points,
          rank: user.rank,
          class_id: user.class_id,
          hasClassData: !!user.classes,
          classInfo: user.classes ? {
            course_name: user.classes.course_name,
            university: user.classes.universities?.name,
            country: user.classes.universities?.countries?.name
          } : null
        }))
      });
    }
  }, [topUsers, viewMode]);

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
          <LoadingSpinner 
            message="Loading top performers..." 
            size="sm" 
            variant="minimal"
            className="p-4"
          />
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
                      const character = getCharacterByPoints(profile.points || 0);
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
                    {profile.full_name || 'Unknown User'}
                    {profile.user_id === user?.id && (
                      <span className="text-primary text-xs ml-1 sm:ml-2">(You)</span>
                    )}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <Badge className={`text-xs w-fit ${getRankColor(profile.rank || 'bronze')} text-white`}>
                      {profile.rank || 'bronze'}
                    </Badge>
                    <div className="text-xs text-muted-foreground truncate">
                      {profile.classes?.course_name ? (
                        <>
                          <div>{profile.classes.course_name}</div>
                          {viewMode === 'global' && profile.classes?.universities?.name && (
                            <div className="text-muted-foreground/80">
                              {profile.classes.universities.name}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground/70">
                          {viewMode === 'global' ? 'No course assigned' : 'Course not found'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
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