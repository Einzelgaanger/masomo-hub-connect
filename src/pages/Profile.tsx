import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  User,
  Mail,
  Calendar,
  MapPin,
  GraduationCap,
  Award,
  BookOpen,
  MessageCircle,
  Edit3,
  Image,
  X,
  Building,
  Briefcase,
  Globe,
  Link,
  Plus,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CHARACTERS } from "@/data/characters";
import { AchievementPost } from "@/components/achievements/AchievementPost";
import { CreateAchievementForm } from "@/components/achievements/CreateAchievementForm";
import ProfileEditForm from "@/components/profile/ProfileEditForm";
import { SimpleProfilePictureUpload } from "@/components/profile/SimpleProfilePictureUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Profile {
  user_id: string;
  full_name: string;
  email: string;
  profile_picture_url: string;
  bio?: string;
  points: number;
  rank: string;
  created_at: string;
  last_login?: string;
  character_id?: number;
  role?: string;
  admission_number?: string;
  current_company?: string;
  current_position?: string;
  industry?: string;
  linkedin_url?: string;
  mentoring_available?: boolean;
  country_id?: string;
  university_id?: string;
  course_id?: string;
  year?: string;
  semester?: string;
  profile_completed?: boolean;
  classes?: {
    course_name: string;
    course_year: number;
    semester: number;
    course_group: string;
    universities: {
      name: string;
      countries: {
        name: string;
      };
    };
  };
}

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditingAlumni, setIsEditingAlumni] = useState(false);
  const [isUpdatingAlumni, setIsUpdatingAlumni] = useState(false);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [achievementsLoading, setAchievementsLoading] = useState(false);
  const [isCreateAchievementOpen, setIsCreateAchievementOpen] = useState(false);
  const [canCreateAchievement, setCanCreateAchievement] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [alumniData, setAlumniData] = useState({
    current_company: "",
    current_position: "",
    industry: "",
    linkedin_url: "",
    bio: "",
    mentoring_available: false
  });

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchAchievements();
      checkCreateAchievementPermissions();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      // First get the basic profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      // Then get related data separately to avoid foreign key ambiguity
      const [countryData, universityData, courseData] = await Promise.all([
        profileData.country_id ? supabase
          .from('countries')
          .select('name')
          .eq('id', profileData.country_id)
          .single() : { data: null },
        profileData.university_id ? supabase
          .from('universities')
          .select('name')
          .eq('id', profileData.university_id)
          .single() : { data: null },
        profileData.course_id ? supabase
          .from('courses')
          .select('name')
          .eq('id', profileData.course_id)
          .single() : { data: null }
      ]);

      // Combine the data
      const combinedData = {
        ...profileData,
        countries: countryData.data,
        universities: universityData.data,
        courses: courseData.data
      };

      setProfile(combinedData);
      
      // Debug character_id
      console.log('Profile data:', combinedData);
      console.log('Character ID:', combinedData?.character_id);
      console.log('Character ID type:', typeof combinedData?.character_id);
      
      // Set alumni data for editing
      if (combinedData?.role === 'alumni') {
        setAlumniData({
          current_company: combinedData.current_company || "",
          current_position: combinedData.current_position || "",
          industry: combinedData.industry || "",
          linkedin_url: combinedData.linkedin_url || "",
          bio: combinedData.bio || "",
          mentoring_available: combinedData.mentoring_available || false
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAchievements = async () => {
    if (!userId) return;
    
    try {
      setAchievementsLoading(true);
      
      // Use the ultra simple function to get user achievements with accurate counts
      console.log('Using ultra simple query for user achievements');
      const { data, error } = await supabase
        .rpc('get_all_achievements_with_counts_ultra_simple', {
          user_id_param: user?.id || null
        });

      if (error) throw error;
      
      // Filter to only show achievements by this user
      const userAchievements = (data || []).filter(achievement => achievement.user_id === userId);
      setAchievements(userAchievements);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setAchievementsLoading(false);
    }
  };

  const checkCreateAchievementPermissions = async () => {
    if (!user) {
      setCanCreateAchievement(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, class_id, profile_completed, country_id, university_id, course_id, year')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      // Check if profile is completed (has all required fields)
      const isProfileComplete = profile?.profile_completed === true || (
        profile?.country_id && 
        profile?.university_id && 
        profile?.course_id && 
        profile?.year
      );

      setCanCreateAchievement(isProfileComplete);
    } catch (error) {
      console.error('Error checking achievement permissions:', error);
      setCanCreateAchievement(false);
    }
  };

  const handleAchievementCreated = (newAchievement: any) => {
    setIsCreateAchievementOpen(false);
    fetchAchievements(); // Refresh achievements
  };

  const handleAchievementDeleted = (achievementId: string) => {
    setAchievements(prev => prev.filter(a => a.id !== achievementId));
  };

  const handleProfileUpdated = (updatedProfile: any) => {
    setProfile(updatedProfile);
    setIsEditingProfile(false);
    fetchProfile(); // Refresh to get latest data
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload image to storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      // Update profile with new image URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture_url: publicUrl })
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Profile picture updated successfully.",
      });

      fetchProfile(); // Refresh profile data
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast({
        title: "Error",
        description: "Failed to update profile picture.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ profile_picture_url: null })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile picture removed successfully.",
      });

      fetchProfile(); // Refresh profile data
    } catch (error) {
      console.error('Error removing profile picture:', error);
      toast({
        title: "Error",
        description: "Failed to remove profile picture.",
        variant: "destructive",
      });
    }
  };

  const handleAlumniUpdate = async () => {
    if (!alumniData.current_company || !alumniData.current_position) {
      toast({
        title: "Error",
        description: "Please fill in company and position fields.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingAlumni(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          current_company: alumniData.current_company,
          current_position: alumniData.current_position,
          industry: alumniData.industry,
          linkedin_url: alumniData.linkedin_url,
          bio: alumniData.bio,
          mentoring_available: alumniData.mentoring_available
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Alumni profile updated successfully.",
      });

      setIsEditingAlumni(false);
      fetchProfile(); // Refresh profile data
    } catch (error) {
      console.error('Error updating alumni profile:', error);
      toast({
        title: "Error",
        description: "Failed to update alumni profile.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingAlumni(false);
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank.toLowerCase()) {
      case 'bronze': return 'bg-orange-100 text-orange-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'platinum': return 'bg-blue-100 text-blue-800';
      case 'diamond': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRankIcon = (rank: string) => {
    switch (rank.toLowerCase()) {
      case 'bronze': return '🥉';
      case 'silver': return '🥈';
      case 'gold': return '🥇';
      case 'platinum': return '💎';
      case 'diamond': return '💠';
      default: return '⭐';
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Profile not found</h3>
            <p className="text-muted-foreground">This user profile doesn't exist.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Edit Form */}
        {isEditingProfile && isOwnProfile && (
          <ProfileEditForm
            profile={profile}
            onSave={handleProfileUpdated}
            onCancel={() => setIsEditingProfile(false)}
          />
        )}

        {/* Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="relative">
                {isOwnProfile ? (
                  <SimpleProfilePictureUpload
                    currentImageUrl={profile.profile_picture_url}
                    onImageUpdate={(newImageUrl) => {
                      setProfile(prev => prev ? { ...prev, profile_picture_url: newImageUrl } : null);
                    }}
                    className="h-24 w-24"
                  />
                ) : (
                  <div className="h-24 w-24 shadow-lg overflow-hidden" style={{ borderRadius: '20%' }}>
                    {profile.profile_picture_url ? (
                      <img 
                        src={profile.profile_picture_url} 
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-semibold bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {profile.full_name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                    )}
                  </div>
                )}
                {profile.character_id && (
                  <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 bg-background rounded-full p-0.5 shadow-lg ring-2 ring-background">
                    <img
                      src={getCharacterImage(profile.character_id)}
                      alt="Character"
                      className="h-7 w-7 rounded-full"
                      onError={(e) => {
                        console.log('Character image failed to load:', profile.character_id, getCharacterImage(profile.character_id));
                        e.currentTarget.src = '/characters/anonymous.png'; // Fallback
                      }}
                      onLoad={() => {
                        console.log('Character image loaded successfully:', profile.character_id, getCharacterImage(profile.character_id));
                      }}
                    />
                  </div>
                )}
                {!profile.character_id && (
                  <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 bg-red-500 rounded-full p-1">
                    <span className="text-white text-xs">No Char</span>
                  </div>
                )}
                <Input
                  id="profile-picture-input"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </div>
              
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{profile.full_name}</h1>
                    {profile.bio && (
                      <p className="text-muted-foreground mb-4 max-w-md">{profile.bio}</p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{profile.email}</span>
                        <Badge variant="outline" className="text-xs">
                          Google Account
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Joined {format(new Date(profile.created_at), 'MMM dd, yyyy')}</span>
                      </div>
                      {profile.last_login && (
                        <div className="flex items-center gap-2">
                          <span>Last active: {format(new Date(profile.last_login), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                      {profile.admission_number && (
                        <div className="flex items-center gap-2">
                          <span>Admission: {profile.admission_number}</span>
                        </div>
                      )}
                      {profile.role && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {!isOwnProfile && (
                      <Button
                        onClick={() => navigate(`/inbox/${userId}`)}
                        className="mb-2"
                        size="sm"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Send Message
                      </Button>
                    )}
                    {isOwnProfile && (
                      <Button
                        onClick={() => setIsEditingProfile(true)}
                        variant="outline"
                        size="sm"
                        className="mb-2"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    )}
                    <Badge className={`${getRankColor(profile.rank)} text-lg px-3 py-1`}>
                      {getRankIcon(profile.rank)} {profile.rank.toUpperCase()}
                    </Badge>
                    <div className="text-2xl font-bold text-primary">
                      {profile.points.toLocaleString()} points
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Academic Information */}
        {(profile.country_id || profile.university_id || profile.course_id || profile.year) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {profile.courses?.name && (
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{profile.courses.name}</p>
                        {profile.year && (
                          <p className="text-sm text-muted-foreground">
                            Year {profile.year}
                            {profile.semester && `, ${profile.semester}`}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {profile.universities?.name && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{profile.universities.name}</p>
                        {profile.countries?.name && (
                          <p className="text-sm text-muted-foreground">
                            {profile.countries.name}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  {profile.profile_completed && (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Profile Complete</p>
                        <p className="text-sm text-muted-foreground">Ready to join classes</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Current Rank</p>
                      <p className="text-sm text-muted-foreground">
                        {profile.rank.charAt(0).toUpperCase() + profile.rank.slice(1)} Level
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {profile.points.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Total Points</p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {profile.rank.charAt(0).toUpperCase() + profile.rank.slice(1)}
                </div>
                <p className="text-sm text-muted-foreground">Current Rank</p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {Math.floor((new Date().getTime() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                </div>
                <p className="text-sm text-muted-foreground">Days Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievement Info */}
        <Card>
          <CardHeader>
            <CardTitle>How to Earn Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Upload Notes</span>
                  <span className="text-sm font-medium text-green-600">+5 points</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Upload Past Papers</span>
                  <span className="text-sm font-medium text-green-600">+7 points</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Comment on Posts</span>
                  <span className="text-sm font-medium text-green-600">+2 points</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Daily Visit</span>
                  <span className="text-sm font-medium text-green-600">+2 points</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Receive Likes</span>
                  <span className="text-sm font-medium text-green-600">+1 point</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Receive Dislikes</span>
                  <span className="text-sm font-medium text-red-600">-1 point</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Complete Assignments</span>
                  <span className="text-sm font-medium text-green-600">+10 points</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Create Events</span>
                  <span className="text-sm font-medium text-green-600">+4 points</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Achievements
                {achievements.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {achievements.length}
                  </Badge>
                )}
              </CardTitle>
              {isOwnProfile && canCreateAchievement && (
                <Button
                  size="sm"
                  onClick={() => setIsCreateAchievementOpen(true)}
                  className="rounded-md h-7 w-7 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {achievementsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : achievements.length === 0 ? (
              <div className="text-center py-8">
                <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {isOwnProfile ? "No achievements yet" : "No achievements shared"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {isOwnProfile 
                    ? "Share your first achievement to showcase your accomplishments!"
                    : "This user hasn't shared any achievements yet."
                  }
                </p>
                {isOwnProfile && canCreateAchievement && (
                  <Button onClick={() => setIsCreateAchievementOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Share Achievement
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {achievements.map((achievement) => (
                  <AchievementPost
                    key={achievement.id}
                    achievement={achievement}
                    onDelete={handleAchievementDeleted}
                    showComments={false}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alumni Profile Section - Only for Alumni */}
        {profile?.role === 'alumni' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Professional Information
                {isOwnProfile && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditingAlumni(!isEditingAlumni)}
                    className="ml-auto"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    {isEditingAlumni ? 'Cancel' : 'Edit'}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditingAlumni ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="current_company">Current Company *</Label>
                      <Input
                        id="current_company"
                        value={alumniData.current_company}
                        onChange={(e) => setAlumniData({...alumniData, current_company: e.target.value})}
                        placeholder="Enter your company name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="current_position">Current Position *</Label>
                      <Input
                        id="current_position"
                        value={alumniData.current_position}
                        onChange={(e) => setAlumniData({...alumniData, current_position: e.target.value})}
                        placeholder="Enter your job title"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={alumniData.industry}
                      onChange={(e) => setAlumniData({...alumniData, industry: e.target.value})}
                      placeholder="e.g., Technology, Finance, Healthcare"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
                    <Input
                      id="linkedin_url"
                      type="url"
                      value={alumniData.linkedin_url}
                      onChange={(e) => setAlumniData({...alumniData, linkedin_url: e.target.value})}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="alumni_bio">Professional Bio</Label>
                    <Textarea
                      id="alumni_bio"
                      value={alumniData.bio}
                      onChange={(e) => setAlumniData({...alumniData, bio: e.target.value})}
                      placeholder="Tell us about your professional journey and achievements..."
                      rows={4}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="mentoring_available"
                      checked={alumniData.mentoring_available}
                      onChange={(e) => setAlumniData({...alumniData, mentoring_available: e.target.checked})}
                      className="rounded"
                      title="Available for mentoring current students"
                      aria-label="Available for mentoring current students"
                    />
                    <Label htmlFor="mentoring_available">Available for mentoring current students</Label>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleAlumniUpdate}
                      disabled={isUpdatingAlumni}
                    >
                      {isUpdatingAlumni ? "Updating..." : "Update Profile"}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setIsEditingAlumni(false);
                        // Reset form data
                        setAlumniData({
                          current_company: profile.current_company || "",
                          current_position: profile.current_position || "",
                          industry: profile.industry || "",
                          linkedin_url: profile.linkedin_url || "",
                          bio: profile.bio || "",
                          mentoring_available: profile.mentoring_available || false
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {(profile.current_company || profile.current_position) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {profile.current_company && (
                        <div className="flex items-center gap-3">
                          <Building className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Current Company</p>
                            <p className="text-sm text-muted-foreground">{profile.current_company}</p>
                          </div>
                        </div>
                      )}
                      {profile.current_position && (
                        <div className="flex items-center gap-3">
                          <Briefcase className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Current Position</p>
                            <p className="text-sm text-muted-foreground">{profile.current_position}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {profile.industry && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Industry</p>
                        <p className="text-sm text-muted-foreground">{profile.industry}</p>
                      </div>
                    </div>
                  )}
                  
                  {profile.linkedin_url && (
                    <div className="flex items-center gap-3">
                      <Link className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">LinkedIn Profile</p>
                        <a 
                          href={profile.linkedin_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {profile.linkedin_url}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {profile.mentoring_available && (
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Available for Mentoring
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create Achievement Dialog */}
        <Dialog open={isCreateAchievementOpen} onOpenChange={setIsCreateAchievementOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Share Your Achievement</DialogTitle>
              <DialogDescription>
                Share your accomplishments with the community. Upload photos or videos to showcase your achievements.
              </DialogDescription>
            </DialogHeader>
            <CreateAchievementForm
              onSuccess={handleAchievementCreated}
              onCancel={() => setIsCreateAchievementOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

// Helper function to get character image
const getCharacterImage = (characterId: number | string): string => {
  console.log('Looking for character:', characterId, typeof characterId);
  
  // Handle common character ID variations
  let searchId = characterId;
  if (characterId === 'guard') {
    searchId = 'guardian'; // Map 'guard' to 'guardian'
  }
  
  // Find character by ID or rank in the CHARACTERS array
  const character = CHARACTERS.find(char => 
    char.id === searchId || 
    char.rank === searchId ||
    char.id === characterId || 
    char.rank === characterId
  );
  
  console.log('Found character:', character?.name, character?.image);
  
  if (character) {
    return character.image;
  }
  
  // Fallback to anonymous if character not found
  const anonymousCharacter = CHARACTERS.find(char => char.id === 'anonymous');
  console.log('Using fallback character:', anonymousCharacter?.name, anonymousCharacter?.image);
  return anonymousCharacter?.image || '/characters/anonymous.png';
};

export default Profile;