import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
    fetchCountries();
  }, []);

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

  const handleContinue = () => {
    if (!selectedCountry || !selectedUniversity || !selectedClass) {
      toast({
        title: "Error",
        description: "Please select a country, university, and class.",
        variant: "destructive",
      });
      return;
    }

    // Navigate to application form with the selected class ID
    navigate(`/application?classId=${selectedClass}`);
  };

  const selectedCountryName = countries.find(c => c.id === selectedCountry)?.name;
  const selectedUniversityName = universities.find(u => u.id === selectedUniversity)?.name;
  const selectedClassName = classes.find(c => c.id === selectedClass);

  return (
    <div className="min-h-screen flex items-start justify-center pt-16 sm:pt-20 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-orange-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-8 -right-4 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-4 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative">
        <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-2xl">
          <CardHeader className="space-y-6">
            <div className="flex justify-center">
              <Logo size="lg" className="scale-125 sm:scale-150" />
            </div>
            <div className="space-y-2 text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Choose Your Class
              </h2>
              <p className="text-sm text-gray-600">
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
  );
};

export default ClassSelection;