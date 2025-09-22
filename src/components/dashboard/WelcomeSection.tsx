import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Award, Calendar, BookOpen } from "lucide-react";

interface WelcomeSectionProps {
  profile: any;
}

export function WelcomeSection({ profile }: WelcomeSectionProps) {
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
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {profile?.full_name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Ready to continue your learning journey?
        </p>
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

      {profile?.classes && (
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-2">Your Class</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Course:</span> {profile.classes.course_name}</p>
              <p><span className="font-medium">Year:</span> {profile.classes.course_year}</p>
              <p><span className="font-medium">Semester:</span> {profile.classes.semester}</p>
              <p><span className="font-medium">Group:</span> {profile.classes.course_group}</p>
              <p><span className="font-medium">University:</span> {profile.classes.universities?.name}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}