import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  MapPin, 
  GraduationCap, 
  BookOpen, 
  Calendar,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface Country {
  id: string;
  name: string;
  code: string;
}

interface University {
  id: string;
  name: string;
  country_id: string;
  website?: string;
}

interface Course {
  id: string;
  name: string;
  university_id: string;
}

interface ProfileEditFormProps {
  profile: any;
  onSave: (updatedProfile: any) => void;
  onCancel: () => void;
}

const ProfileEditForm = ({ profile, onSave, onCancel }: ProfileEditFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
    bio: profile?.bio || '',
    country_id: profile?.country_id || '',
    university_id: profile?.university_id || '',
    course_id: profile?.course_id || '',
    year: profile?.year || '',
    semester: profile?.semester || '',
    profile_completed: profile?.profile_completed || false
  });

  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingUniversities, setLoadingUniversities] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (formData.country_id) {
      fetchUniversities(formData.country_id);
    }
  }, [formData.country_id]);

  useEffect(() => {
    if (formData.university_id) {
      fetchCourses(formData.university_id);
    }
  }, [formData.university_id]);

  const fetchCountries = async () => {
    try {
      setLoadingCountries(true);
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name');

      if (error) throw error;
      setCountries(data || []);
    } catch (error) {
      console.error('Error fetching countries:', error);
      toast({
        title: "Error",
        description: "Failed to load countries.",
        variant: "destructive",
      });
    } finally {
      setLoadingCountries(false);
    }
  };

  const fetchUniversities = async (countryId: string) => {
    try {
      setLoadingUniversities(true);
      const { data, error } = await supabase
        .from('universities')
        .select('*')
        .eq('country_id', countryId)
        .order('name');

      if (error) throw error;
      setUniversities(data || []);
    } catch (error) {
      console.error('Error fetching universities:', error);
      toast({
        title: "Error",
        description: "Failed to load universities.",
        variant: "destructive",
      });
    } finally {
      setLoadingUniversities(false);
    }
  };

  const fetchCourses = async (universityId: string) => {
    try {
      setLoadingCourses(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('university_id', universityId)
        .order('name');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to load courses.",
        variant: "destructive",
      });
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleSave = async () => {
    if (!formData.full_name || !formData.email) {
      toast({
        title: "Error",
        description: "Please fill in your name and email.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          bio: formData.bio,
          country_id: formData.country_id || null,
          university_id: formData.university_id || null,
          course_id: formData.course_id || null,
          year: formData.year || null,
          semester: formData.semester || null,
          // profile_completed will be set automatically by trigger
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });

      onSave({
        ...profile,
        ...formData,
        profile_completed: true // Will be updated by trigger
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isProfileComplete = formData.full_name && formData.email && formData.country_id && 
                           formData.university_id && formData.course_id && formData.year;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Edit Profile
          {isProfileComplete && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Complete
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <User className="h-4 w-4" />
            Basic Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                placeholder="Enter your full name"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="Enter your email"
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email cannot be changed
              </p>
            </div>
          </div>
          
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>
        </div>

        {/* Academic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Academic Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">Country *</Label>
              <Select 
                value={formData.country_id} 
                onValueChange={(value) => setFormData({...formData, country_id: value, university_id: '', course_id: ''})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  {loadingCountries ? (
                    <SelectItem value="loading" disabled>Loading countries...</SelectItem>
                  ) : (
                    countries.map((country) => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="university">University *</Label>
              <Select 
                value={formData.university_id} 
                onValueChange={(value) => setFormData({...formData, university_id: value, course_id: ''})}
                disabled={!formData.country_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your university" />
                </SelectTrigger>
                <SelectContent>
                  {loadingUniversities ? (
                    <SelectItem value="loading" disabled>Loading universities...</SelectItem>
                  ) : universities.length === 0 ? (
                    <SelectItem value="none" disabled>No universities found</SelectItem>
                  ) : (
                    universities.map((university) => (
                      <SelectItem key={university.id} value={university.id}>
                        {university.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="course">Course *</Label>
              <Select 
                value={formData.course_id} 
                onValueChange={(value) => setFormData({...formData, course_id: value})}
                disabled={!formData.university_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your course" />
                </SelectTrigger>
                <SelectContent>
                  {loadingCourses ? (
                    <SelectItem value="loading" disabled>Loading courses...</SelectItem>
                  ) : courses.length === 0 ? (
                    <SelectItem value="none" disabled>No courses found</SelectItem>
                  ) : (
                    courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="year">Year *</Label>
              <Select 
                value={formData.year} 
                onValueChange={(value) => setFormData({...formData, year: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st Year">1st Year</SelectItem>
                  <SelectItem value="2nd Year">2nd Year</SelectItem>
                  <SelectItem value="3rd Year">3rd Year</SelectItem>
                  <SelectItem value="4th Year">4th Year</SelectItem>
                  <SelectItem value="5th Year">5th Year</SelectItem>
                  <SelectItem value="Graduated">Graduated</SelectItem>
                  <SelectItem value="Alumni">Alumni</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="semester">Semester</Label>
            <Select 
              value={formData.semester} 
              onValueChange={(value) => setFormData({...formData, semester: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fall">Fall</SelectItem>
                <SelectItem value="Spring">Spring</SelectItem>
                <SelectItem value="Summer">Summer</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="6">6</SelectItem>
                <SelectItem value="7">7</SelectItem>
                <SelectItem value="8">8</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Profile Completion Status */}
        {!isProfileComplete && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Profile Incomplete</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Complete your profile to access all features including Sifa achievements and class participation.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button 
            onClick={handleSave} 
            disabled={loading || !isProfileComplete}
            className="flex-1"
          >
            {loading ? "Saving..." : "Save Profile"}
          </Button>
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileEditForm;
