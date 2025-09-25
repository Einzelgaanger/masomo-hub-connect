import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User,
  Mail,
  Calendar,
  MapPin,
  GraduationCap,
  Award,
  BookOpen,
  MessageCircle
} from "lucide-react";
import { format } from "date-fns";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

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
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
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
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.profile_picture_url} />
                  <AvatarFallback className="text-2xl">
                    {profile.full_name.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {profile.character_id && (
                  <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-lg">
                    <img
                      src={`/characters/${getCharacterImage(profile.character_id)}.png`}
                      alt="Character"
                      className="h-8 w-8 rounded-full"
                    />
                  </div>
                )}
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
        {profile.classes && (
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
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{profile.classes.course_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Year {profile.classes.course_year}, Semester {profile.classes.semester}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{profile.classes.universities.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {profile.classes.universities.countries.name}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Group</p>
                      <p className="text-sm text-muted-foreground">
                        {profile.classes.course_group}
                      </p>
                    </div>
                  </div>
                  
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
                  <span className="text-sm font-medium text-green-600">+10 points</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Upload Past Papers</span>
                  <span className="text-sm font-medium text-green-600">+10 points</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Comment on Posts</span>
                  <span className="text-sm font-medium text-green-600">+3 points</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Daily Visit</span>
                  <span className="text-sm font-medium text-green-600">+1 point</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Receive Likes</span>
                  <span className="text-sm font-medium text-green-600">+2 points</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Receive Dislikes</span>
                  <span className="text-sm font-medium text-red-600">-1 point</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Complete Assignments</span>
                  <span className="text-sm font-medium text-green-600">+5 points</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Create Events</span>
                  <span className="text-sm font-medium text-green-600">+8 points</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

// Helper function to get character image filename
const getCharacterImage = (characterId: number): string => {
  const characters = [
    'anonymous', 'angel', 'assasin', 'elf', 'guard', 'halloween', 
    'leonardo', 'people', 'pinocchio', 'pirate', 'superhero', 'swordsman', 'zombie'
  ];
  return characters[characterId - 1] || 'anonymous';
};

export default Profile;