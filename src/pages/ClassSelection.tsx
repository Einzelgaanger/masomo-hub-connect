import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, User, IdCard, GraduationCap } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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
  course_group: string;
  course_year: number;
  semester: number;
  university_id: string;
}

const ClassSelection = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Cascading dropdown data
  const [countries, setCountries] = useState<Country[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);

  // Selected values
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedUniversity, setSelectedUniversity] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');

  // Application form data
  const [fullName, setFullName] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    
    if (user) {
      loadCountries();
      checkExistingApplication();
    }
  }, [user, authLoading, navigate]);

  const checkExistingApplication = async () => {
    if (!user) return;

    try {
      // Check if user already has a profile with a class assigned
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, class_id, role')
        .eq('user_id', user.id)
        .single();

      if (profile?.class_id && profile.role !== 'admin') {
        // User already has a class, redirect to dashboard
        navigate('/dashboard');
        return;
      }

      // Check for pending application - temporarily disabled due to types
      // Will be enabled once Supabase types update
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const loadCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCountries(data || []);
    } catch (error) {
      console.error('Error loading countries:', error);
      toast({
        title: "Error",
        description: "Failed to load countries. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const loadUniversities = async (countryId: string) => {
    try {
      const { data, error } = await supabase
        .from('universities')
        .select('id, name, country_id')
        .eq('country_id', countryId)
        .order('name');

      if (error) throw error;
      setUniversities(data || []);
      setClasses([]);
      setSelectedUniversity('');
      setSelectedClass('');
    } catch (error) {
      console.error('Error loading universities:', error);
      toast({
        title: "Error",
        description: "Failed to load universities. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadClasses = async (universityId: string) => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, course_name, course_group, course_year, semester, university_id')
        .eq('university_id', universityId)
        .eq('is_graduated', false)
        .order('course_name, course_year, semester');

      if (error) throw error;
      setClasses(data || []);
      setSelectedClass('');
    } catch (error) {
      console.error('Error loading classes:', error);
      toast({
        title: "Error",
        description: "Failed to load classes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCountryChange = (countryId: string) => {
    setSelectedCountry(countryId);
    if (countryId) {
      loadUniversities(countryId);
    } else {
      setUniversities([]);
      setClasses([]);
      setSelectedUniversity('');
      setSelectedClass('');
    }
  };

  const handleUniversityChange = (universityId: string) => {
    setSelectedUniversity(universityId);
    if (universityId) {
      loadClasses(universityId);
    } else {
      setClasses([]);
      setSelectedClass('');
    }
  };

  const handleSubmitApplication = async () => {
    if (!user || !selectedClass || !fullName.trim() || !admissionNumber.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields and select your class.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Insert application
      const { error } = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          email: user.email,
          class_id: selectedClass,
          full_name: fullName.trim(),
          admission_number: admissionNumber.trim(),
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Application Submitted!",
        description: "Your application has been sent to the admin for approval. You will be notified once it's reviewed.",
      });

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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner message="Loading..." />
      </div>
    );
  }

  const selectedUniversityData = universities.find(u => u.id === selectedUniversity);
  const selectedClassData = classes.find(c => c.id === selectedClass);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Logo className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Your Class</h1>
          <p className="text-gray-600">Select your academic program to request access</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl text-center">Class Selection & Application</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Country Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Country</label>
              <Select value={selectedCountry} onValueChange={handleCountryChange}>
                <SelectTrigger>
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
              <label className="text-sm font-semibold text-gray-700">University</label>
              <Select 
                value={selectedUniversity} 
                onValueChange={handleUniversityChange}
                disabled={!selectedCountry}
              >
                <SelectTrigger>
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
              <label className="text-sm font-semibold text-gray-700">Course/Class</label>
              <Select 
                value={selectedClass} 
                onValueChange={setSelectedClass}
                disabled={!selectedUniversity}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.course_name} - {classItem.course_group} (Year {classItem.course_year}, Semester {classItem.semester})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedClass && (
              <>
                {/* Selection Summary */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">Selected Program:</h3>
                  <div className="space-y-1 text-sm text-blue-800">
                    <p><strong>Country:</strong> {countries.find(c => c.id === selectedCountry)?.name}</p>
                    <p><strong>University:</strong> {selectedUniversityData?.name}</p>
                    <p><strong>Course:</strong> {selectedClassData?.course_name}</p>
                    <p><strong>Group:</strong> {selectedClassData?.course_group}</p>
                    <p><strong>Year:</strong> {selectedClassData?.course_year}, Semester {selectedClassData?.semester}</p>
                  </div>
                </div>

                {/* Application Form */}
                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Details
                  </h3>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Official Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="text"
                        placeholder="Enter your full name as on official documents"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Admission Number</label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="text"
                        placeholder="Enter your student ID/admission number"
                        value={admissionNumber}
                        onChange={(e) => setAdmissionNumber(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-800">
                      <strong>Note:</strong> Your application will be reviewed by the class administrator. 
                      Make sure your email ({user?.email}) matches your school records and that your 
                      admission number is correct.
                    </p>
                  </div>

                  <Button
                    onClick={handleSubmitApplication}
                    disabled={submitting || !fullName.trim() || !admissionNumber.trim()}
                    className="w-full h-12 text-base"
                  >
                    {submitting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Submitting Application...
                      </>
                    ) : (
                      <>
                        <GraduationCap className="mr-2 h-5 w-5" />
                        Submit Application
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            <div className="text-center pt-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/login')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClassSelection;