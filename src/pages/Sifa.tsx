import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  TrendingUp, 
  Users, 
  Award,
  GraduationCap,
  MapPin,
  Calendar,
  Trophy
} from "lucide-react";
import { AchievementPost } from "@/components/achievements/AchievementPost";
import { CreateAchievementForm } from "@/components/achievements/CreateAchievementForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Achievement {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_email: string;
  author_picture?: string;
  university_name?: string;
  course_name?: string;
  course_year?: number;
  semester?: number;
  course_group?: string;
  country_name?: string;
  media_count: number;
  likes_count: number;
  comments_count: number;
  views_count: number;
  user_liked: boolean;
}

export default function Sifa() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUniversity, setFilterUniversity] = useState<string>("all");
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [universities, setUniversities] = useState<string[]>([]);
  const [courses, setCourses] = useState<string[]>([]);
  const [canCreate, setCanCreate] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  console.log('Sifa component rendering, user:', user);
  console.log('canCreate state:', canCreate);

  useEffect(() => {
    checkCreatePermissions();
    fetchAchievements();
    fetchFilterOptions();
  }, []);

  const checkCreatePermissions = async () => {
    if (!user) {
      console.log('No user, setting canCreate to false');
      setCanCreate(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, class_id')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      console.log('Profile data for permissions:', profile);
      const canCreateValue = (profile?.role === 'student' && profile?.class_id !== null) || profile?.role === 'super_admin';
      console.log('Setting canCreate to:', canCreateValue);
      setCanCreate(canCreateValue);
    } catch (error) {
      console.error('Error checking permissions:', error);
      setCanCreate(false);
    }
  };

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      
      // Use simple query without complex joins for now
      console.log('Using simple query for achievements');
      const directResult = await supabase
        .from('achievements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      const data = directResult.data;
      const error = directResult.error;

      console.log('Achievements query result:', { data, error });

      if (error) {
        console.error('Achievements query error:', error);
        throw error;
      }
      
      // Transform data and fetch profile info separately
      const transformedData = await Promise.all(
        (data || []).map(async (achievement) => {
          // Fetch profile data for each achievement
          const { data: profileData } = await supabase
            .from('profiles')
            .select(`
              full_name,
              email,
              profile_picture_url,
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
            .eq('user_id', achievement.user_id)
            .single();

          return {
            id: achievement.id,
            user_id: achievement.user_id,
            title: achievement.title,
            description: achievement.description,
            created_at: achievement.created_at,
            updated_at: achievement.updated_at,
            author_name: profileData?.full_name || 'Unknown',
            author_email: profileData?.email || '',
            author_picture: profileData?.profile_picture_url,
            university_name: profileData?.classes?.universities?.name,
            course_name: profileData?.classes?.course_name,
            course_year: profileData?.classes?.course_year,
            semester: profileData?.classes?.semester,
            course_group: profileData?.classes?.course_group,
            country_name: profileData?.classes?.universities?.countries?.name,
            media_count: 0, // Will be fetched separately
            likes_count: 0, // Will be fetched separately
            comments_count: 0, // Will be fetched separately
            views_count: 0, // Will be fetched separately
            user_liked: false // Will be fetched separately
          };
        })
      );
      
      setAchievements(transformedData);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      toast({
        title: "Error",
        description: "Failed to load achievements.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      // Skip the problematic achievements query and go straight to profiles
      await fetchUniversitiesFromProfiles();
    } catch (error) {
      console.error('Error fetching filter options:', error);
      setUniversities([]);
      setCourses([]);
    }
  };

  const fetchUniversitiesFromProfiles = async () => {
    try {
      // Fallback: Get unique universities from profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          classes!inner(
            universities(name)
          )
        `)
        .not('class_id', 'is', null);

      if (profilesError) throw profilesError;

      const uniqueUniversities = new Set<string>();

      profilesData?.forEach(profile => {
        const university = profile.classes?.universities?.name;
        if (university) uniqueUniversities.add(university);
      });

      setUniversities(Array.from(uniqueUniversities).sort());
    } catch (error) {
      console.error('Error fetching universities from profiles:', error);
      setUniversities([]);
    }
  };

  const fetchCoursesForUniversity = async (universityName: string) => {
    try {
      // First try to get courses from achievements
      try {
        const { data: achievementsData, error: achievementsError } = await supabase
          .from('achievements')
          .select(`
            profiles!inner(
              classes!inner(
                universities(name),
                course_name
              )
            )
          `);

        if (achievementsError) {
          console.log('Achievements table not available for courses, falling back to profiles');
          throw achievementsError;
        }

        const uniqueCourses = new Set<string>();
        
        if (universityName === "all") {
          achievementsData?.forEach(achievement => {
            const course = achievement.profiles?.classes?.course_name;
            if (course) uniqueCourses.add(course);
          });
        } else {
          achievementsData?.forEach(achievement => {
            const university = achievement.profiles?.classes?.universities?.name;
            const course = achievement.profiles?.classes?.course_name;
            
            if (university === universityName && course) {
              uniqueCourses.add(course);
            }
          });
        }

        if (uniqueCourses.size > 0) {
          setCourses(Array.from(uniqueCourses).sort());
          return;
        }
      } catch (achievementsError) {
        console.log('Achievements query failed for courses, using profiles fallback');
      }

      // Fallback to profiles if achievements table doesn't exist or is empty
      await fetchCoursesFromProfiles(universityName);
      
    } catch (error) {
      console.error('Error fetching courses for university:', error);
      setCourses([]);
    }
  };

  const fetchCoursesFromProfiles = async (universityName: string) => {
    try {
      // Fallback: Get courses from profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          classes!inner(
            universities(name),
            course_name
          )
        `)
        .not('class_id', 'is', null);

      if (profilesError) throw profilesError;

      const uniqueCourses = new Set<string>();
      profilesData?.forEach(profile => {
        const university = profile.classes?.universities?.name;
        const course = profile.classes?.course_name;
        
        if ((universityName === "all" || university === universityName) && course) {
          uniqueCourses.add(course);
        }
      });

      setCourses(Array.from(uniqueCourses).sort());
    } catch (error) {
      console.error('Error fetching courses from profiles:', error);
      setCourses([]);
    }
  };

  const filteredAchievements = achievements.filter(achievement => {
    const matchesSearch = searchQuery === "" || 
      achievement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      achievement.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      achievement.author_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesUniversity = filterUniversity === "all" || 
      achievement.university_name === filterUniversity;

    const matchesCourse = filterCourse === "all" || 
      achievement.course_name === filterCourse;

    return matchesSearch && matchesUniversity && matchesCourse;
  });

  const handleAchievementCreated = (newAchievement: any) => {
    setIsCreateDialogOpen(false);
    fetchAchievements(); // Refresh the list
  };

  const handleAchievementDeleted = (achievementId: string) => {
    setAchievements(prev => prev.filter(a => a.id !== achievementId));
  };

  const stats = {
    totalAchievements: achievements.length,
    totalLikes: achievements.reduce((sum, a) => sum + a.likes_count, 0),
    totalComments: achievements.reduce((sum, a) => sum + a.comments_count, 0),
    totalViews: achievements.reduce((sum, a) => sum + a.views_count, 0)
  };

  try {
    return (
      <AppLayout>
        {/* Floating Achievement Button */}
        {canCreate && (
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="fixed top-1/2 right-4 sm:right-6 z-50 transform -translate-y-1/2 -translate-y-16 w-12 h-12 sm:w-14 sm:h-14 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center group hover:scale-110"
            style={{ backgroundColor: '#f59e0b' }}
            title="Share achievement"
          >
            <Trophy className="h-5 w-5 sm:h-6 sm:w-6 group-hover:rotate-12 transition-transform duration-300" />
          </button>
        )}
        
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <div className="max-w-7xl mx-auto space-y-6 px-3 sm:px-6 py-6 sm:py-8">

        {/* Search and Filters */}
        <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              {/* Search Bar with Filter Toggle */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search achievements, projects, skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 sm:h-14 text-base border-2 focus:border-primary/50 transition-colors duration-200 rounded-xl"
                  />
                </div>
                
                {/* Filter Toggle Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`h-12 sm:h-14 px-4 rounded-xl border-2 transition-all duration-200 ${
                    showFilters 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'hover:border-primary/50'
                  }`}
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Filters</span>
                </Button>
              </div>
              
              {/* Collapsible Filter Dropdowns */}
              {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">University</label>
                    <Select 
                      value={filterUniversity} 
                      onValueChange={(value) => {
                        setFilterUniversity(value);
                        setFilterCourse("all"); // Reset course filter when university changes
                        fetchCoursesForUniversity(value);
                      }}
                    >
                      <SelectTrigger className="h-12 border-2 rounded-xl focus:border-primary/50 transition-colors duration-200">
                        <SelectValue placeholder="Select university" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all" className="rounded-lg">All Universities</SelectItem>
                        {universities.map(university => (
                          <SelectItem key={university} value={university} className="rounded-lg">
                            {university}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Course</label>
                    <Select value={filterCourse} onValueChange={setFilterCourse}>
                      <SelectTrigger className="h-12 border-2 rounded-xl focus:border-primary/50 transition-colors duration-200">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all" className="rounded-lg">All Courses</SelectItem>
                        {courses.map(course => (
                          <SelectItem key={course} value={course} className="rounded-lg">
                            {course}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Achievements Feed */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16 sm:py-24">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-primary/20 border-t-primary"></div>
                <p className="text-sm text-muted-foreground">Loading achievements...</p>
              </div>
            </div>
          ) : filteredAchievements.length === 0 ? (
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardContent className="text-center py-16 sm:py-24 px-6">
                <div className="mx-auto w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center mb-6">
                  <Award className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 text-slate-900 dark:text-slate-100">No achievements found</h3>
                <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed">
                  {searchQuery || filterUniversity !== "all" || filterCourse !== "all"
                    ? "Try adjusting your filters to discover amazing achievements from the community."
                    : "Be the first to share your achievement and inspire others!"}
                </p>
                {canCreate && (
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)} 
                    className="h-12 sm:h-14 px-8 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Trophy className="h-5 w-5 mr-2" />
                    <span className="hidden sm:inline">Share Your First Achievement</span>
                    <span className="sm:hidden">Share Achievement</span>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAchievements.map((achievement, index) => (
                <div 
                  key={achievement.id}
                  className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <AchievementPost
                    achievement={achievement}
                    onDelete={handleAchievementDeleted}
                    showComments={false}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Achievement Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden p-0 gap-0">
            <div className="flex flex-col h-full">
              <DialogHeader className="p-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  Share Your Achievement
                </DialogTitle>
                <DialogDescription className="text-base text-muted-foreground mt-2">
                  Share your accomplishments with the community. Upload photos or videos to showcase your achievements and inspire others.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto p-6">
                <CreateAchievementForm
                  onSuccess={handleAchievementCreated}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
          </div>
        </div>
      </AppLayout>
  );
  } catch (error) {
    console.error('Sifa component error:', error);
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Error Loading Sifa</h1>
            <p className="text-muted-foreground mb-4">
              There was an error loading the achievements page.
            </p>
            <p className="text-sm text-muted-foreground">
              Error: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }
}
