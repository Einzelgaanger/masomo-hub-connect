import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Image, Edit3, X, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);



  const [alumniData, setAlumniData] = useState({
    current_company: "",
    current_position: "",
    industry: "",
    linkedin_url: "",
    bio: "",
    mentoring_available: false
  });
  const [isEditingAlumni, setIsEditingAlumni] = useState(false);
  const [isUpdatingAlumni, setIsUpdatingAlumni] = useState(false);

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

      // If user is alumni, fetch alumni profile data
      if (data?.role === 'alumni') {
        const { data: alumniProfile, error: alumniError } = await supabase
          .from('alumni_profiles')
          .select('*')
          .eq('user_id', user?.id)
          .single();

        if (!alumniError && alumniProfile) {
          setAlumniData({
            current_company: alumniProfile.current_company || "",
            current_position: alumniProfile.current_position || "",
            industry: alumniProfile.industry || "",
            linkedin_url: alumniProfile.linkedin_url || "",
            bio: alumniProfile.bio || "",
            mentoring_available: alumniProfile.mentoring_available || false
          });
        }
      }
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
        .from('alumni_profiles')
        .update({
          current_company: alumniData.current_company,
          current_position: alumniData.current_position,
          industry: alumniData.industry || null,
          linkedin_url: alumniData.linkedin_url || null,
          bio: alumniData.bio || null,
          mentoring_available: alumniData.mentoring_available
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Alumni profile updated successfully!",
      });

      setIsEditingAlumni(false);
      fetchProfile();
    } catch (error: any) {
      console.error('Error updating alumni profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update alumni profile.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingAlumni(false);
    }
  };


  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}_${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      // Update profile with new picture URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture_url: urlData.publicUrl })
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Profile picture updated successfully.",
      });

      fetchProfile();
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast({
        title: "Error",
        description: "Failed to upload profile picture.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    try {
      setIsUploading(true);

      const { error } = await supabase
        .from('profiles')
        .update({ profile_picture_url: null })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile picture removed successfully.",
      });

      fetchProfile();
    } catch (error) {
      console.error('Error removing profile picture:', error);
      toast({
        title: "Error",
        description: "Failed to remove profile picture.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'bronze': return 'bg-amber-100 text-amber-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'platinum': return 'bg-blue-100 text-blue-800';
      case 'diamond': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AppLayout>
             {/* Header */}
             <div className="flex items-center gap-4">
               <div>
                 <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">
                  Manage your profile and account settings
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Overview */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Profile Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-4">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={profile?.profile_picture_url} />
                          <AvatarFallback className="text-lg">
                            {profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="absolute -top-1 -right-1 h-8 w-8 rounded-full p-0 bg-primary hover:bg-primary/80 text-white"
                              disabled={isUploading}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => document.getElementById('profile-picture-input')?.click()}>
                              <Image className="h-4 w-4 mr-2" />
                              Update Photo
                            </DropdownMenuItem>
                            {profile?.profile_picture_url && (
                              <DropdownMenuItem 
                                onClick={handleRemoveProfilePicture}
                                className="text-red-600 focus:text-red-600"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Remove Photo
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Input
                          id="profile-picture-input"
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureUpload}
                          className="hidden"
                          disabled={isUploading}
                        />
                      </div>
                      <h3 className="font-semibold">{profile?.full_name}</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">{profile?.email}</p>
                        <Badge variant="outline" className="text-xs">
                          Google Account
                        </Badge>
                      </div>
                      <Badge className={getRankColor(profile?.rank)}>
                        {profile?.rank?.charAt(0).toUpperCase() + profile?.rank?.slice(1)}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {profile?.points} points
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Admission Number:</span>
                        <span className="font-medium">{profile?.admission_number || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Role:</span>
                        <span className="font-medium capitalize">{profile?.role}</span>
                      </div>
                    </div>
                    
                    {/* Class Details Section */}
                    {profile?.classes && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm text-center text-primary">Class Information</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Course:</span>
                              <span className="font-medium">{profile.classes.course_name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Year:</span>
                              <span className="font-medium">{profile.classes.course_year}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Semester:</span>
                              <span className="font-medium">{profile.classes.semester}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Group:</span>
                              <span className="font-medium">{profile.classes.course_group}</span>
                            </div>
                            {profile?.classes?.universities && (
                              <>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">University:</span>
                                  <span className="font-medium">{profile.classes.universities.name}</span>
                                </div>
                                {profile?.classes?.universities?.countries && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Country:</span>
                                    <span className="font-medium">{profile.classes.universities.countries.name}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Settings Forms */}
              <div className="lg:col-span-2 space-y-6">

                {/* Alumni Profile Settings - Only for Alumni */}
                {profile?.role === 'alumni' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Alumni Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                                  current_company: "",
                                  current_position: "",
                                  industry: "",
                                  linkedin_url: "",
                                  bio: "",
                                  mentoring_available: false
                                });
                                fetchProfile(); // Reload original data
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Current Company</Label>
                              <p className="text-sm text-muted-foreground">
                                {alumniData.current_company || "Not specified"}
                              </p>
                            </div>
                            <div>
                              <Label>Current Position</Label>
                              <p className="text-sm text-muted-foreground">
                                {alumniData.current_position || "Not specified"}
                              </p>
                            </div>
                          </div>
                          
                          <div>
                            <Label>Industry</Label>
                            <p className="text-sm text-muted-foreground">
                              {alumniData.industry || "Not specified"}
                            </p>
                          </div>
                          
                          {alumniData.linkedin_url && (
                            <div>
                              <Label>LinkedIn Profile</Label>
                              <a 
                                href={alumniData.linkedin_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                {alumniData.linkedin_url}
                              </a>
                            </div>
                          )}
                          
                          {alumniData.bio && (
                            <div>
                              <Label>Professional Bio</Label>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {alumniData.bio}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${alumniData.mentoring_available ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <span className="text-sm text-muted-foreground">
                              {alumniData.mentoring_available ? 'Available for mentoring' : 'Not available for mentoring'}
                            </span>
                          </div>
                          
                          <Button 
                            variant="outline"
                            onClick={() => setIsEditingAlumni(true)}
                          >
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit Alumni Profile
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

              </div>
            </div>
    </AppLayout>
  );
};

export default Settings;
