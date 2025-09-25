import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, ArrowLeft, User, Hash, CheckCircle } from "lucide-react";
import Logo from "@/components/ui/Logo";

interface ClassDetails {
  id: string;
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
}

const ApplicationForm = () => {
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

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

    const classId = new URLSearchParams(location.search).get('classId');
    if (classId) {
      fetchClassDetails(classId);
    } else {
      toast({
        title: "Error",
        description: "No class selected. Please go back and select a class.",
        variant: "destructive",
      });
      navigate('/class-selection');
    }
  }, [location.search, navigate, toast]);

  const fetchClassDetails = async (classId: string) => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          course_name,
          course_year,
          semester,
          course_group,
          universities (
            name,
            countries (name)
          )
        `)
        .eq('id', classId)
        .single();

      if (error) throw error;
      setClassDetails(data);
    } catch (error) {
      console.error('Error fetching class details:', error);
      toast({
        title: "Error",
        description: "Failed to load class details.",
        variant: "destructive",
      });
      navigate('/class-selection');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim() || !admissionNumber.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!classDetails) {
      toast({
        title: "Error",
        description: "Class details not found.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Get current session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        console.error('No valid session found:', sessionError);
        toast({
          title: "Session Expired",
          description: "Please sign in again to submit your application.",
          variant: "destructive",
        });
        navigate('/login?mode=signin');
        return;
      }

      const currentUser = session.user;
      console.log('Submitting application for authenticated user:', currentUser.email);

      // Check if user already has an application for this class
      const { data: existingApplications, error: checkError } = await supabase
        .from('applications' as any)
        .select('id, status')
        .eq('user_id', currentUser.id)
        .eq('class_id', classDetails.id);

      if (checkError) {
        console.error('Error checking existing applications:', checkError);
        // Continue anyway - don't block submission for this check
      }

      if (existingApplications && existingApplications.length > 0) {
        const existingApplication = existingApplications[0];
        toast({
          title: "Application Already Submitted",
          description: `You have already submitted an application for this class. Status: ${(existingApplication as any).status}`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Submit the application
      const { error: insertError } = await supabase
        .from('applications' as any)
        .insert({
          user_id: currentUser.id,
          class_id: classDetails.id,
          full_name: fullName.trim(),
          admission_number: admissionNumber.trim(),
          email: currentUser.email, // Include email for admin verification
          status: 'pending'
        });

      if (insertError) throw insertError;

      setSubmitted(true);
      toast({
        title: "Application Submitted!",
        description: "Your application has been submitted successfully. Please wait for admin approval.",
      });

      // Store email for application status tracking
      if (currentUser.email) {
        localStorage.setItem('application_email', currentUser.email);
      }

      // Redirect to application status page after a short delay
      setTimeout(() => {
        navigate(`/application-status?email=${encodeURIComponent(currentUser.email || '')}`);
      }, 2000);

    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
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
            <Link to="/" className="inline-block">
              <Logo size="lg" showText={true} className="scale-125 sm:scale-150" />
            </Link>
          </div>

          <div className="max-w-md mx-auto w-full">
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 fredoka-bold">
                    Application Submitted!
                  </h1>
                  <p className="text-sm text-gray-600 fredoka-medium">
                    Your application has been successfully submitted
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">What's Next?</h3>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Your application is now pending review</li>
                    <li>• An administrator will review your details</li>
                    <li>• You'll be redirected to check your status</li>
                    <li>• You can always return to this page to check updates</li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Application Details</h3>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Name:</strong> {fullName}</p>
                    <p><strong>Admission Number:</strong> {admissionNumber}</p>
                    <p><strong>Class:</strong> {classDetails?.course_name}</p>
                    <p><strong>University:</strong> {classDetails?.universities.name}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => navigate(`/application-status?email=${encodeURIComponent(localStorage.getItem('application_email') || '')}`)}
                  className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  Check Application Status
                </Button>
                <Button
                  onClick={() => navigate('/class-selection')}
                  variant="outline"
                  className="w-full h-10 border-2 border-gray-300 hover:border-gray-400"
                >
                  Apply to Another Class
                </Button>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!classDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading class details...</p>
        </div>
      </div>
    );
  }

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
          <Link to="/" className="inline-block">
            <Logo size="lg" showText={true} className="scale-125 sm:scale-150" />
          </Link>
        </div>

        <div className="max-w-md mx-auto w-full">

        <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 fredoka-bold">
                Complete Your Application
              </h1>
              <p className="text-sm text-gray-600 fredoka-medium">
                Please provide your official details for verification
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Class Information */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Selected Class</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>{classDetails.course_name}</strong></p>
                <p>{classDetails.universities.name} • {classDetails.universities.countries.name}</p>
                <p>Year {classDetails.course_year}, Semester {classDetails.semester}</p>
                {classDetails.course_group && (
                  <p>Group {classDetails.course_group}</p>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name as it appears in school records"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="admissionNumber" className="text-sm font-medium text-gray-700">
                  Admission Number *
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="admissionNumber"
                    type="text"
                    placeholder="Enter your admission/registration number"
                    value={admissionNumber}
                    onChange={(e) => setAdmissionNumber(e.target.value)}
                    className="pl-10 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  {loading ? "Submitting..." : "Submit Application"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </form>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Make sure your details match your school records. Incorrect information may delay approval.
              </p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;