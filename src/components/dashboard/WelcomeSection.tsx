import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Crown, Star, Flame } from "lucide-react";
import { useProfile } from "@/components/layout/AppLayout";
import { getCharacterByPoints } from "@/types/characters";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

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

      // If no visit today, streak is 0
      if (!todayVisit) {
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
      default: return 'bg-gray-400';
    }
  };


  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">
            Welcome back, {profile?.full_name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Ready to continue your learning journey?
          </p>
        </div>
        
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="text-right">
            <div className="flex items-center gap-1.5 lg:gap-2 justify-end mb-1">
              <Flame className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-orange-500 flex-shrink-0" />
              <span className="text-xs lg:text-sm font-medium text-orange-600">
                {loadingStreak ? "..." : streak}
              </span>
            </div>
            <p className="text-xs lg:text-sm font-medium truncate max-w-32 lg:max-w-none">{profile?.full_name}</p>
            <p className="text-xs text-muted-foreground truncate max-w-32 lg:max-w-none">{profile?.email}</p>
          </div>
          
          <Avatar className="h-8 w-8 lg:h-10 xl:h-12 lg:w-10 xl:w-12 flex-shrink-0">
            <AvatarImage src={profile?.profile_picture_url} />
            <AvatarFallback className="text-xs lg:text-sm">
              {profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
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
                  <img 
                    src={getCharacterByPoints(profile?.points || 0).image} 
                    alt={getCharacterByPoints(profile?.points || 0).name}
                    className="w-16 h-16 lg:w-24 lg:h-24 object-contain drop-shadow-lg"
                  />
                  <div className="absolute -top-1 -right-1 lg:-top-2 lg:-right-2">
                    <div className="w-6 h-6 lg:w-8 lg:h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Star className="w-3 h-3 lg:w-5 lg:h-5 text-white" />
                    </div>
                  </div>
                </div>
                <h3 className="font-bold text-base lg:text-lg mt-2 text-center">
                  {getCharacterByPoints(profile?.points || 0).name}
                </h3>
                <p className="text-xs lg:text-sm text-muted-foreground text-center">
                  Your Current Character
                </p>
              </div>

              {/* Rank Display */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className={`w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center ${getRankColor(profile?.rank)}`}>
                    <Crown className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 lg:-top-2 lg:-right-2">
                    <Badge className={`text-xs ${getRankColor(profile?.rank)} text-white px-1 py-0.5 lg:px-2 lg:py-1`}>
                      {profile?.points} pts
                    </Badge>
                  </div>
                </div>
                <h3 className="font-bold text-base lg:text-lg mt-2 text-center capitalize">
                  {profile?.rank} Scholar
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
                Character: <span className="font-bold">{getCharacterByPoints(profile?.points || 0).name}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}