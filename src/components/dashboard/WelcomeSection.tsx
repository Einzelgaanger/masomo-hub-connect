import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { TrendingUp, Award, Calendar, BookOpen, Crown, Star } from "lucide-react";
import { useProfile } from "@/components/layout/AppLayout";
import { getCharacterByPoints } from "@/types/characters";

export function WelcomeSection() {
  const profile = useProfile();
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

  const stats = [
    {
      icon: TrendingUp,
      label: "Points",
      value: profile?.points || 0,
      color: "text-green-600"
    },
    {
      icon: Award,
      label: "Rank",
      value: profile?.rank || 'bronze',
      color: "text-amber-600"
    },
    {
      icon: BookOpen,
      label: "Units",
      value: profile?.classes?.units?.length || 0,
      color: "text-blue-600"
    },
    {
      icon: Calendar,
      label: "Daily Streak",
      value: "1", // This would be calculated from daily_visits
      color: "text-purple-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {profile?.full_name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Ready to continue your learning journey?
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium">{profile?.full_name}</p>
            <p className="text-xs text-muted-foreground">{profile?.email}</p>
          </div>
          
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile?.profile_picture_url} />
            <AvatarFallback>
              {profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">
                    {stat.label === 'Rank' ? (
                      <Badge className={`${getRankColor(stat.value.toString())} text-white`}>
                        {stat.value}
                      </Badge>
                    ) : (
                      stat.value
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Character & Rank Showcase */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Character Display */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <img 
                    src={getCharacterByPoints(profile?.points || 0).image} 
                    alt={getCharacterByPoints(profile?.points || 0).name}
                    className="w-24 h-24 object-contain drop-shadow-lg"
                  />
                  <div className="absolute -top-2 -right-2">
                    <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
                <h3 className="font-bold text-lg mt-2 text-center">
                  {getCharacterByPoints(profile?.points || 0).name}
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  Your Current Character
                </p>
              </div>

              {/* Rank Display */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center ${getRankColor(profile?.rank)}`}>
                    <Crown className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <Badge className={`text-xs ${getRankColor(profile?.rank)} text-white px-2 py-1`}>
                      {profile?.points} pts
                    </Badge>
                  </div>
                </div>
                <h3 className="font-bold text-lg mt-2 text-center capitalize">
                  {profile?.rank} Scholar
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  Your Current Rank
                </p>
              </div>
            </div>

            {/* Progress Info */}
            <div className="text-right">
              <h4 className="font-semibold text-lg mb-2">Your Progress</h4>
              <p className="text-sm text-muted-foreground mb-1">
                Total Points: <span className="font-bold text-purple-600">{profile?.points || 0}</span>
              </p>
              <p className="text-sm text-muted-foreground mb-1">
                Rank: <span className="font-bold capitalize">{profile?.rank || 'bronze'}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Character: <span className="font-bold">{getCharacterByPoints(profile?.points || 0).name}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}