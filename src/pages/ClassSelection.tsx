import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, ArrowLeft, GraduationCap } from "lucide-react";
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
  const [countries, setCountries] = useState<Country[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedUniversity, setSelectedUniversity] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication first
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.user) {
        console.log('No valid session found, redirecting to login');
        navigate('/login?mode=signin');
        return;
      }
      
      console.log('User authenticated:', session.user.email);
    };

    checkAuth();
    fetchCountries();
  }, [navigate]);

  useEffect(() => {
    if (selectedCountry) {
      fetchUniversities(selectedCountry);
      setSelectedUniversity('');
      setSelectedClass('');
      setClasses([]);
    } else {
      setUniversities([]);
      setClasses([]);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedUniversity) {
      fetchClasses(selectedUniversity);
      setSelectedClass('');
    } else {
      setClasses([]);
    }
  }, [selectedUniversity]);

  const fetchCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('id, name')
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
    try {
      const { data, error } = await supabase
        .from('universities')
        .select('id, name, country_id')
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
    }
  };

  const fetchClasses = async (universityId: string) => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, course_name, course_year, semester, course_group, university_id')
        .eq('university_id', universityId)
        .order('course_name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        title: "Error",
        description: "Failed to load classes.",
        variant: "destructive",
      });
    }
  };

  const handleContinue = async () => {
    if (!selectedCountry || !selectedUniversity || !selectedClass) {
      toast({
        title: "Error",
        description: "Please select a country, university, and class.",
        variant: "destructive",
      });
      return;
    }

    // Check if user has an existing application
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      toast({
        title: "Error",
        description: "Please sign in to continue.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    // Check for existing applications
    const { data: existingApplications, error: checkError } = await supabase
      .from('applications' as any)
      .select('id, status, class_id')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (checkError) {
      console.error('Error checking existing applications:', checkError);
      // Continue anyway - don't block for this check
    }

    if (existingApplications && existingApplications.length > 0) {
      // User has existing applications, redirect to status page
      const latestApplication = existingApplications[0];
      toast({
        title: "Application Found",
        description: `You already have an application. Status: ${(latestApplication as any).status}`,
        variant: "default",
      });
      navigate('/application-status');
      return;
    }

    // No existing applications, proceed to application form
    navigate(`/application?classId=${selectedClass}`);
  };

  const selectedCountryName = countries.find(c => c.id === selectedCountry)?.name;
  const selectedUniversityName = universities.find(u => u.id === selectedUniversity)?.name;
  const selectedClassName = classes.find(c => c.id === selectedClass);

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
        <div className="max-w-md mx-auto w-full">
        {/* Header with Logo */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block">
            <Logo size="lg" showText={true} className="scale-125 sm:scale-150" />
          </Link>
        </div>

        <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 fredoka-bold">
                Choose Your Class
              </h1>
              <p className="text-sm text-gray-600 fredoka-medium">
                Select your university and class to continue with your application
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {/* Country Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Country *
                </label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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

              {/* University Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  University *
                </label>
                <Select 
                  value={selectedUniversity} 
                  onValueChange={setSelectedUniversity}
                  disabled={!selectedCountry}
                >
                  <SelectTrigger className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select your university" />
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

              {/* Class Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Class *
                </label>
                <Select 
                  value={selectedClass} 
                  onValueChange={setSelectedClass}
                  disabled={!selectedUniversity}
                >
                  <SelectTrigger className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select your class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        {classItem.course_name} - Year {classItem.course_year}, Sem {classItem.semester}
                        {classItem.course_group && ` (${classItem.course_group})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selection Summary */}
              {selectedClassName && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <GraduationCap className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-medium text-blue-900">Selected Class:</h4>
                      <p className="text-sm text-blue-800">
                        <strong>{selectedClassName.course_name}</strong><br />
                        {selectedUniversityName} • {selectedCountryName}<br />
                        Year {selectedClassName.course_year}, Semester {selectedClassName.semester}
                        {selectedClassName.course_group && ` • Group ${selectedClassName.course_group}`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                className="flex-1 h-10 border-2 border-gray-300 hover:border-gray-400"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
              <Button
                onClick={handleContinue}
                disabled={!selectedClass || loading}
                className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {loading ? "Loading..." : "Continue"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Don't see your class? Contact your administrator to have it added.
              </p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default ClassSelection;