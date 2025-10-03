import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Flame } from "lucide-react";
import { useProfile } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { getCharacter, getCharacterImage, getCharacterName } from "@/utils/characterUtils";

export function WelcomeSection() {
  const profile = useProfile();
  const [streak, setStreak] = useState(0);
  const [loadingStreak, setLoadingStreak] = useState(true);

  useEffect(() => {
    if (profile?.user_id) {
      fetchStreak();
    }
  }, [profile?.user_id]);

  const fetchStreak = async () => {
    try {
      setLoadingStreak(true);
      
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Check if user visited today
      const { data: todayVisit, error: todayError } = await supabase
        .from('daily_visits')
        .select('id')
        .eq('user_id', profile.user_id)
        .eq('visit_date', today)
        .maybeSingle();

      // If there's an error or no visit today, streak is 0
      if (todayError || !todayVisit) {
        setStreak(0);
        return;
      }

      // Calculate consecutive days streak
      let currentStreak = 1;
      let currentDate = new Date();
      currentDate.setDate(currentDate.getDate() - 1); // Start from yesterday

      while (true) {
        const checkDate = currentDate.toISOString().split('T')[0];
        
        const { data: visit } = await supabase
          .from('daily_visits')
          .select('id')
          .eq('user_id', profile.user_id)
          .eq('visit_date', checkDate)
          .maybeSingle();

        if (!visit) {
          break; // No visit on this date, streak ends
        }

        currentStreak++;
        currentDate.setDate(currentDate.getDate() - 1);
      }

      setStreak(currentStreak);
    } catch (error) {
      console.error('Error fetching streak:', error);
      setStreak(0);
    } finally {
      setLoadingStreak(false);
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

  // Debug logging (only in development)
  useEffect(() => {
    if (profile && process.env.NODE_ENV === 'development') {
      const character = getCharacter(profile);
      console.log('WelcomeSection Profile Data:', {
        full_name: profile.full_name,
        points: profile.points,
        rank: profile.rank,
        character_id: profile.character_id,
        character: character
      });
    }
  }, [profile]);


  return (
    <div className="space-y-4 lg:space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">
                  Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}! 👋
                </h1>
                <p className="text-muted-foreground mt-1">
                  Ready to continue your learning journey?
                </p>
              </div>
              
              <div className="flex items-center gap-2 lg:gap-3">
                <Flame className="h-5 w-5 lg:h-6 lg:w-6 text-orange-500 flex-shrink-0" />
                <span className="text-sm lg:text-base font-medium text-orange-600">
                  {loadingStreak ? "..." : streak}
                </span>
                <span className="text-xs lg:text-sm text-muted-foreground">day streak</span>
              </div>
            </div>


      {/* Character & Rank Showcase */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-4 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 lg:gap-6">
              {/* Character Display */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  {(() => {
                    const character = getCharacter(profile);
                    return (
                      <>
                        <img 
                          src={getCharacterImage(profile) || '/characters/people.png'} 
                          alt={getCharacterName(profile) || 'Regular'}
                          className="w-16 h-16 lg:w-24 lg:h-24 object-contain drop-shadow-lg"
                          onError={(e) => {
                            e.currentTarget.src = '/characters/people.png';
                          }}
                        />
                        <div className="absolute -top-1 -right-1 lg:-top-2 lg:-right-2">
                          <div className="w-6 h-6 lg:w-8 lg:h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                            <Star className="w-3 h-3 lg:w-5 lg:h-5 text-white" />
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <h3 className="font-bold text-base lg:text-lg mt-2 text-center">
                  {getCharacterName(profile) || 'Regular'}
                </h3>
                <p className="text-xs lg:text-sm text-muted-foreground text-center">
                  Your Current Character
                </p>
              </div>

              {/* Rank Display */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className={`w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center ${getRankColor(profile?.rank || 'bronze')}`}>
                    <Crown className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 lg:-top-2 lg:-right-2">
                    <Badge className={`text-xs ${getRankColor(profile?.rank || 'bronze')} text-white px-1 py-0.5 lg:px-2 lg:py-1`}>
                      {profile?.points || 0} pts
                    </Badge>
                  </div>
                </div>
                <h3 className="font-bold text-base lg:text-lg mt-2 text-center capitalize">
                  {profile?.rank || 'bronze'} Scholar
                </h3>
                <p className="text-xs lg:text-sm text-muted-foreground text-center">
                  Your Current Rank
                </p>
              </div>
            </div>

            {/* Progress Info */}
            <div className="text-center lg:text-right">
              <h4 className="font-semibold text-base lg:text-lg mb-2">Your Progress</h4>
              <p className="text-xs lg:text-sm text-muted-foreground mb-1">
                Total Points: <span className="font-bold text-purple-600">{profile?.points || 0}</span>
              </p>
              <p className="text-xs lg:text-sm text-muted-foreground mb-1">
                Rank: <span className="font-bold capitalize">{profile?.rank || 'bronze'}</span>
              </p>
              <p className="text-xs lg:text-sm text-muted-foreground">
                Character: <span className="font-bold">{getCharacterName(profile) || 'Regular'}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}