import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Target, Zap, Users, MessageCircle, Upload, Calendar, ThumbsUp, ThumbsDown, Award, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CharacterSelector } from "@/components/ui/CharacterSelector";

const Info = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          classes(
            course_name,
            course_year,
            semester,
            course_group,
            universities(
              name,
              countries(name)
            )
          )
        `)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRankInfo = (rank: string) => {
    switch (rank) {
      case 'bronze':
        return {
          icon: <Award className="h-8 w-8 text-amber-600" />,
          color: 'bg-amber-100 text-amber-800',
          name: 'Bronze Scholar',
          description: 'Starting your academic journey',
          points: '0-49 points'
        };
      case 'silver':
        return {
          icon: <Star className="h-8 w-8 text-gray-600" />,
          color: 'bg-gray-100 text-gray-800',
          name: 'Silver Scholar',
          description: 'Building your knowledge base',
          points: '50-99 points'
        };
      case 'gold':
        return {
          icon: <Trophy className="h-8 w-8 text-yellow-600" />,
          color: 'bg-yellow-100 text-yellow-800',
          name: 'Gold Scholar',
          description: 'Excelling in your studies',
          points: '100-199 points'
        };
      case 'platinum':
        return {
          icon: <Crown className="h-8 w-8 text-blue-600" />,
          color: 'bg-blue-100 text-blue-800',
          name: 'Platinum Scholar',
          description: 'Mastering your field',
          points: '200-349 points'
        };
      case 'diamond':
        return {
          icon: <Crown className="h-8 w-8 text-purple-600" />,
          color: 'bg-purple-100 text-purple-800',
          name: 'Diamond Scholar',
          description: 'Academic excellence achieved',
          points: '350+ points'
        };
      default:
        return {
          icon: <Award className="h-8 w-8 text-gray-600" />,
          color: 'bg-gray-100 text-gray-800',
          name: 'Bronze Scholar',
          description: 'Starting your academic journey',
          points: '0-49 points'
        };
    }
  };

  const pointActions = [
    {
      action: "Upload a note",
      points: 10,
      icon: <Upload className="h-5 w-5" />,
      description: "Share your study materials with classmates"
    },
    {
      action: "Upload a past paper",
      points: 15,
      icon: <Upload className="h-5 w-5" />,
      description: "Help others prepare for exams"
    },
    {
      action: "Complete an assignment",
      points: 20,
      icon: <Target className="h-5 w-5" />,
      description: "Finish your coursework on time"
    },
    {
      action: "Like content",
      points: 2,
      icon: <ThumbsUp className="h-5 w-5" />,
      description: "Show appreciation for helpful content"
    },
    {
      action: "Comment on content",
      points: 3,
      icon: <MessageCircle className="h-5 w-5" />,
      description: "Engage in discussions and help others"
    },
    {
      action: "Daily visit",
      points: 5,
      icon: <Calendar className="h-5 w-5" />,
      description: "Stay active and engaged daily"
    }
  ];

  const pointLossActions = [
    {
      action: "Your content gets disliked",
      points: -1,
      icon: <ThumbsDown className="h-5 w-5" />,
      description: "Each dislike on your uploads, assignments, or comments reduces your points"
    }
  ];

  const ranks = [
    { rank: 'bronze', ...getRankInfo('bronze') },
    { rank: 'silver', ...getRankInfo('silver') },
    { rank: 'gold', ...getRankInfo('gold') },
    { rank: 'platinum', ...getRankInfo('platinum') },
    { rank: 'diamond', ...getRankInfo('diamond') }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentRankInfo = getRankInfo(profile?.rank || 'bronze');

  return (
    <AppLayout>
             {/* Header */}
             <div className="flex items-center gap-4">
               <div>
                 <h1 className="text-3xl font-bold">How to Earn Points</h1>
                <p className="text-muted-foreground">
                  Learn about our gamification system and how to level up your academic journey
                </p>
              </div>
            </div>

            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Your Current Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    {currentRankInfo.icon}
                    <div>
                      <h3 className="font-semibold">{currentRankInfo.name}</h3>
                      <p className="text-sm text-muted-foreground">{currentRankInfo.description}</p>
                    </div>
                  </div>
                  <Badge className={`${currentRankInfo.color} text-lg px-4 py-2`}>
                    {profile?.points || 0} Points
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* How to Earn Points */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  How to Earn Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pointActions.map((action, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                      <div className="p-2 bg-primary/10 rounded-full">
                        {action.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{action.action}</h4>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">+{action.points} pts</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* How to Lose Points */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ThumbsDown className="h-5 w-5 text-red-500" />
                  How to Lose Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pointLossActions.map((action, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 border rounded-lg border-red-200 bg-red-50/50">
                      <div className="p-2 bg-red-100 rounded-full">
                        {action.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{action.action}</h4>
                          <Badge variant="secondary" className="bg-red-100 text-red-800">{action.points} pts</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Rank System */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Rank System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ranks.map((rank, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {rank.icon}
                        <div>
                          <h4 className="font-semibold">{rank.name}</h4>
                          <p className="text-sm text-muted-foreground">{rank.description}</p>
                        </div>
                      </div>
                      <Badge className={`${rank.color} ml-auto`}>
                        {rank.points}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tips for Success */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Tips for Success
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Maximize Your Points</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Visit daily to earn your daily bonus points (+5 pts)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Share high-quality notes (+10 pts) and past papers (+15 pts)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Complete assignments on time (+20 pts)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Engage with content by liking (+2 pts) and commenting (+3 pts)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500">⚠</span>
                        <span>Avoid posting low-quality content (-1 pt per dislike received)</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Community Guidelines</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Share accurate and helpful content</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Be respectful in comments and discussions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Help your classmates succeed</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Report inappropriate content</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Character Collection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Character Collection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CharacterSelector 
                  currentPoints={profile?.points || 0}
                  currentCharacterId={profile?.character_id}
                />
              </CardContent>
            </Card>

            {/* Wall of Fame Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Wall of Fame
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  The Wall of Fame showcases the top performers in your university. 
                  Rankings are based on total points earned and are updated in real-time.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <h4 className="font-semibold">1st Place</h4>
                    <p className="text-sm text-muted-foreground">Top performer</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Award className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                    <h4 className="font-semibold">2nd Place</h4>
                    <p className="text-sm text-muted-foreground">Runner up</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Star className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                    <h4 className="font-semibold">3rd Place</h4>
                    <p className="text-sm text-muted-foreground">Third place</p>
                  </div>
                </div>
              </CardContent>
            </Card>
    </AppLayout>
  );
};

export default Info;
