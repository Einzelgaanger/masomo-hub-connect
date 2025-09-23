import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, BookOpen, GraduationCap, FileText, TrendingUp } from "lucide-react";

export function AdminStatsSection() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalUniversities: 0,
    totalUploads: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch total students
      const { count: studentsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');

      // Fetch total classes
      const { count: classesCount } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true });

      // Fetch total universities
      const { count: universitiesCount } = await supabase
        .from('universities')
        .select('*', { count: 'exact', head: true });

      // Fetch total uploads
      const { count: uploadsCount } = await supabase
        .from('uploads')
        .select('*', { count: 'exact', head: true });

      // Fetch active users (users who logged in within the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: activeUsersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_login', thirtyDaysAgo.toISOString());

      setStats({
        totalStudents: studentsCount || 0,
        totalClasses: classesCount || 0,
        totalUniversities: universitiesCount || 0,
        totalUploads: uploadsCount || 0,
        activeUsers: activeUsersCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Students",
      value: stats.totalStudents,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Active Classes",
      value: stats.totalClasses,
      icon: BookOpen,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Universities",
      value: stats.totalUniversities,
      icon: GraduationCap,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Total Uploads",
      value: stats.totalUploads,
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      title: "Active Users (30d)",
      value: stats.activeUsers,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100"
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </CardTitle>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
