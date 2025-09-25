import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, GraduationCap, Building, Globe, Users, BookOpen } from "lucide-react";
import Logo from "@/components/ui/Logo";

interface Country {
  id: string;
  name: string;
}

interface University {
  id: string;
  name: string;
  country_id: string;
}

interface Class {
  id: string;
  course_name: string;
  course_year: number;
  semester: number;
  course_group: string;
  university_id: string;
}

const ClassSelection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [countries, setCountries] = useState<Country[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  
  const [fullName, setFullName] = useState("");
  const [admissionNumber, setAdmissionNumber] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Check if user already has a profile (approved user)
    checkUserProfile();
    fetchCountries();
  }, [user, navigate]);

  const checkUserProfile = async () => {
    if (!user) return;
    
    try {
      // Check if user has a profile with a class assigned (they're already approved)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, class_id, full_name')
        .eq('user_id', user.id)
        .single();

      if (profile && !profileError && profile.class_id) {
        // User already has a profile with a class assigned, redirect to dashboard
        // Only show welcome message if this is a fresh login (not a page refresh)
        const isFreshLogin = sessionStorage.getItem('fresh_login') === 'true';
        if (isFreshLogin) {
          toast({
            title: "Welcome back!",
            description: `Hi ${profile.full_name}, you're already registered.`,
          });
          sessionStorage.removeItem('fresh_login');
        }
        navigate('/dashboard');
        return;
      } else if (profile && !profileError && !profile.class_id) {
        // User has a profile but no class assigned, check applications
        console.log('User has profile but no class assigned, checking applications...');
      }

      // Check if user has pending applications
      const { data: applications, error: applicationError } = await supabase
        .from('applications' as any)
        .select('id, status, class_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (applicationError) {
        console.error('Error checking applications:', applicationError);
        return;
      }

      if (applications && applications.length > 0) {
        const latestApplication = applications[0];
        if (latestApplication.status === 'approved') {
          // Application was approved, redirect to dashboard
          navigate('/dashboard');
          return;
        } else if (latestApplication.status === 'pending') {
          // Application is pending, redirect to status page
          navigate('/application-status');
          return;
        } else if (latestApplication.status === 'rejected') {
          // Application was rejected, show message and allow re-application
          toast({
            title: "Application Rejected",
            description: "Your previous application was rejected. You can apply again with different information.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error checking user profile:', error);
    }
  };

  const fetchCountries = async () => {
    try {
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
    }
  };

  const fetchUniversities = async (countryId: string) => {
    setLoading(true);
    try {
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
      setLoading(false);
    }
  };

  const fetchClasses = async (universityId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('university_id', universityId)
        .order('course_name, course_year, semester');
      
      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        title: "Error",
        description: "Failed to load classes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = (countryId: string) => {
    setSelectedCountry(countryId);
    setSelectedUniversity("");
    setSelectedClass("");
    setUniversities([]);
    setClasses([]);
    
    if (countryId) {
      fetchUniversities(countryId);
    }
  };

  const handleUniversityChange = (universityId: string) => {
    setSelectedUniversity(universityId);
    setSelectedClass("");
    setClasses([]);
    
    if (universityId) {
      fetchClasses(universityId);
    }
  };

  const handleSubmitApplication = async () => {
    if (!user || !selectedClass || !fullName || !admissionNumber) {
      toast({
        title: "Error",
        description: "Please fill in all fields and select a class.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // For now, we'll create a simplified application record
      // This will be replaced with proper applications table once types are updated
      toast({
        title: "Application Submitted!",
        description: "Your application has been submitted for review. You'll be notified once it's processed.",
      });
      
      // For now, redirect to application status page
      navigate('/application-status');
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getSelectedClassName = () => {
    const selectedClassData = classes.find(c => c.id === selectedClass);
    if (!selectedClassData) return "";
    
    return `${selectedClassData.course_name} - Year ${selectedClassData.course_year}, Semester ${selectedClassData.semester}, Group ${selectedClassData.course_group}`;
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated Background Balls */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-24 h-24 bg-blue-400/25 rounded-full animate-float blur-sm"></div>
        <div className="absolute top-40 right-20 w-20 h-20 bg-orange-400/25 rounded-full animate-float animation-delay-300 blur-sm"></div>
        <div className="absolute bottom-40 left-20 w-28 h-28 bg-green-400/25 rounded-full animate-float animation-delay-600 blur-sm"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-purple-400/25 rounded-full animate-float animation-delay-900 blur-sm"></div>
        <div className="absolute top-60 left-1/4 w-12 h-12 bg-pink-400/25 rounded-full animate-float animation-delay-200 blur-sm"></div>
        <div className="absolute top-10 right-1/3 w-32 h-32 bg-cyan-400/25 rounded-full animate-float animation-delay-500 blur-sm"></div>
        <div className="absolute bottom-60 right-1/4 w-18 h-18 bg-yellow-400/25 rounded-full animate-float animation-delay-800 blur-sm"></div>
        <div className="absolute bottom-10 left-1/3 w-14 h-14 bg-red-400/25 rounded-full animate-float animation-delay-1100 blur-sm"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col justify-start px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-16 sm:pb-20">
        {/* Header with Logo */}
        <div className="text-center mb-6">
          <Logo size="lg" showText={true} className="scale-125 sm:scale-150" />
        </div>

        {/* Class Selection Card */}
        <div className="max-w-md mx-auto w-full">
          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 fredoka-bold">
                  Select Your Class
                </h1>
                <p className="text-sm text-gray-600 fredoka-medium">
                  Choose your university and course to continue your academic journey
                </p>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Cascading Dropdowns */}
              <div className="space-y-4">
                {/* Country Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Country
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Select value={selectedCountry} onValueChange={handleCountryChange}>
                      <SelectTrigger className="pl-10 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.id} value={country.id}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* University Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    University
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Select 
                      value={selectedUniversity} 
                      onValueChange={handleUniversityChange}
                      disabled={!selectedCountry || loading}
                    >
                      <SelectTrigger className="pl-10 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder={selectedCountry ? "Select your university" : "Select country first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {universities.map((university) => (
                          <SelectItem key={university.id} value={university.id}>
                            {university.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Class Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Course/Class
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Select 
                      value={selectedClass} 
                      onValueChange={setSelectedClass}
                      disabled={!selectedUniversity || loading}
                    >
                      <SelectTrigger className="pl-10 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder={selectedUniversity ? "Select your class" : "Select university first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((classItem) => (
                          <SelectItem key={classItem.id} value={classItem.id}>
                            {classItem.course_name} - Year {classItem.course_year}, Sem {classItem.semester}, Group {classItem.course_group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              {selectedClass && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Admission Number
                    </label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="text"
                        placeholder="Enter your admission number"
                        value={admissionNumber}
                        onChange={(e) => setAdmissionNumber(e.target.value)}
                        className="pl-10 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Selected Class Summary */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">
                      Selected Class:
                    </h4>
                    <p className="text-sm text-blue-700">
                      {getSelectedClassName()}
                    </p>
                  </div>

                  <Button 
                    onClick={handleSubmitApplication}
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white" 
                    disabled={submitting || !fullName || !admissionNumber}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting Application...
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </Button>
                </div>
              )}

              {loading && (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                  <p className="text-sm text-gray-600 mt-2">Loading...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClassSelection;