import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Flame } from "lucide-react";
import { useProfile } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { getCharacter, getCharacterImage, getCharacterName } from "@/utils/characterUtils";
import { VideoPlayer } from "@/components/ui/VideoPlayer";

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
          <div className="flex flex-col lg:flex-row lg:items-stretch lg:justify-between gap-6">
            {/* Character Display - Left */}
            <div className="flex flex-col items-center justify-center lg:flex-2">
                <div className="relative">
                  {(() => {
                    const character = getCharacter(profile);
                    return (
                      <>
                        <img 
                          src={getCharacterImage(profile) || '/characters/people.png'} 
                          alt={getCharacterName(profile) || 'Regular'}
                          className="w-24 h-24 lg:w-32 lg:h-32 object-contain drop-shadow-lg"
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
                <h3 className="font-bold text-lg lg:text-xl mt-2 text-center">
                  {getCharacterName(profile) || 'Regular'}
                </h3>
                <p className="text-sm lg:text-base text-muted-foreground text-center">
                  Your Current Character
                </p>
              </div>

            {/* Progress Info with Rank - Center */}
            <div className="text-center lg:text-center lg:flex-1 flex flex-col justify-center">
              <h4 className="font-bold text-sm lg:text-base mb-2">Your Progress</h4>
              
              {/* Compact Rank Display */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getRankColor(profile?.rank || 'bronze')}`}>
                  <Crown className="w-4 h-4 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-purple-600">{profile?.points || 0} pts</p>
                  <p className="text-xs text-muted-foreground capitalize">{profile?.rank || 'bronze'} Scholar</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs lg:text-sm text-muted-foreground">
                  Total Points: <span className="font-bold text-purple-600">{profile?.points || 0}</span>
                </p>
                <p className="text-xs lg:text-sm text-muted-foreground">
                  Rank: <span className="font-bold capitalize">{profile?.rank || 'bronze'}</span>
                </p>
                <p className="text-xs lg:text-sm text-muted-foreground">
                  Character: <span className="font-bold">{getCharacterName(profile) || 'Regular'}</span>
                </p>
              </div>
            </div>

            {/* Video Section - Right */}
            <div className="flex flex-col items-center justify-center lg:flex-1">
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/50 bg-gradient-to-br from-purple-100 to-pink-100 p-4">
                  <div className="relative rounded-xl overflow-hidden">
                    <VideoPlayer
                      src="/video/BUNIFU WEBSITE VIDEO FINAL.mp4"
                      poster="/video/poster.jpg"
                      className="w-80 h-48 lg:w-96 lg:h-60 rounded-xl"
                      autoPlay={true}
                      muted={false}
                      loop={true}
                      showControls={true}
                    />
                  </div>
                  
                  {/* Decorative Elements */}
                  <div className="absolute -top-2 -left-2 w-5 h-5 bg-purple-400 rounded-full animate-pulse"></div>
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-pink-400 rounded-full animate-pulse animation-delay-500"></div>
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-orange-400 rounded-full animate-pulse animation-delay-1000"></div>
                  <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-blue-400 rounded-full animate-pulse animation-delay-1500"></div>
                </div>
              </div>
              <h3 className="font-bold text-base lg:text-lg mt-3 text-center text-gray-800">
                Platform Demo
              </h3>
              <p className="text-sm lg:text-base text-muted-foreground text-center">
                See Bunifu in Action
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}