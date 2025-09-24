import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  LogIn, 
  Home,
  User,
  Mail,
  Calendar,
  GraduationCap
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { Link } from "react-router-dom";

interface ApplicationData {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  full_name: string;
  admission_number: string;
  created_at: string;
  updated_at: string;
  classes: {
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
  };
}

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  role: string;
  class_id: string | null;
  created_at: string;
}

const ApplicationStatus = () => {
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [email, setEmail] = useState<string>('');
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Get email from URL params or localStorage
    const emailParam = searchParams.get('email');
    const cachedEmail = localStorage.getItem('application_email');
    
    if (emailParam) {
      setEmail(emailParam);
      localStorage.setItem('application_email', emailParam);
    } else if (cachedEmail) {
      setEmail(cachedEmail);
    } else {
      // No email found, redirect to home
      navigate('/');
      return;
    }

    checkApplicationStatus();
  }, [searchParams, navigate]);

  const checkApplicationStatus = async () => {
    if (!email) return;
    
    setChecking(true);
    try {
      // First, check if user has a profile (approved)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          email,
          role,
          class_id,
          created_at
        `)
        .eq('email', email)
        .single();

      if (profileData && !profileError) {
        // User has a profile, they are approved
        setUserProfile(profileData);
        setLoading(false);
        setChecking(false);
        return;
      }

      // No profile found, check for pending applications
      const { data: applicationData, error: applicationError } = await supabase
        .from('applications' as any)
        .select(`
          id,
          status,
          full_name,
          admission_number,
          created_at,
          updated_at,
          classes (
            id,
            course_name,
            course_year,
            semester,
            course_group,
            universities (
              name,
              countries (name)
            )
          )
        `)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')
        .order('created_at', { ascending: false })
        .limit(1);

      if (applicationError) {
        console.error('Error checking application:', applicationError);
        // Try to find application by email (if we have a way to link them)
        // For now, we'll show a generic message
      }

      if (applicationData && applicationData.length > 0) {
        setApplication(applicationData[0]);
      }

    } catch (error) {
      console.error('Error checking application status:', error);
      toast({
        title: "Error",
        description: "Failed to check application status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  const handleSignIn = () => {
    // Clear cached email and redirect to login
    localStorage.removeItem('application_email');
    navigate('/login?mode=signin');
  };

  const handleGoHome = () => {
    // Clear cached email and redirect to home
    localStorage.removeItem('application_email');
    navigate('/');
  };

  const handleAutoSignIn = async () => {
    if (!userProfile) return;
    
    try {
      // For Google OAuth users, try to get their session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session && session.user.email === email) {
        // User is already signed in, redirect to dashboard
        navigate('/dashboard');
      } else {
        // Check if this is a Google OAuth user by looking at their auth metadata
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (user && user.email === email && user.app_metadata?.provider === 'google') {
          // This is a Google OAuth user, try to refresh their session
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshData.session && !refreshError) {
            // Session refreshed successfully, redirect to dashboard
            navigate('/dashboard');
          } else {
            // Refresh failed, redirect to login with Google OAuth
            navigate('/login?mode=signin&provider=google&email=' + encodeURIComponent(email));
          }
        } else {
          // Regular email/password user, redirect to login
          navigate('/login?mode=signin&email=' + encodeURIComponent(email));
        }
      }
    } catch (error) {
      console.error('Error with auto sign in:', error);
      navigate('/login?mode=signin&email=' + encodeURIComponent(email));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Clock className="h-8 w-8 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white relative overflow-hidden">
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking your application status...</p>
          </div>
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
        <div className="max-w-2xl mx-auto w-full">
          {/* Header with Logo */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-block">
              <Logo size="lg" showText={true} className="scale-125 sm:scale-150" />
            </Link>
          </div>

          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="space-y-4">
                <div className="flex justify-center">
                  {userProfile ? (
                    <CheckCircle className="h-16 w-16 text-green-500" />
                  ) : application ? (
                    getStatusIcon(application.status)
                  ) : (
                    <User className="h-16 w-16 text-gray-400" />
                  )}
                </div>
                <div className="space-y-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 fredoka-bold">
                    {userProfile ? 'Application Approved!' : application ? 'Application Status' : 'No Application Found'}
                  </h1>
                  <p className="text-sm text-gray-600 fredoka-medium">
                    {email && `Checking status for: ${email}`}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* User Profile Found (Approved) */}
              {userProfile && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-medium text-green-900 mb-2 flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Welcome to Masomo Hub!
                    </h3>
                    <p className="text-sm text-green-800">
                      Your application has been approved and your account is ready to use.
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2 flex items-center">
                      <GraduationCap className="h-5 w-5 mr-2" />
                      Account Details
                    </h3>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p><strong>Email:</strong> {userProfile.email}</p>
                      <p><strong>Role:</strong> {userProfile.role}</p>
                      <p><strong>Status:</strong> Active</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={handleAutoSignIn}
                      className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-medium"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In to Dashboard
                    </Button>
                    <Button
                      onClick={handleGoHome}
                      variant="outline"
                      className="w-full h-10 border-2 border-gray-300 hover:border-gray-400"
                    >
                      <Home className="h-4 w-4 mr-2" />
                      Go to Homepage
                    </Button>
                  </div>
                </div>
              )}

              {/* Application Found */}
              {!userProfile && application && (
                <div className="space-y-4">
                  <div className="flex justify-center mb-4">
                    {getStatusBadge(application.status)}
                  </div>

                  {application.status === 'approved' && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="font-medium text-green-900 mb-2">🎉 Congratulations!</h3>
                      <p className="text-sm text-green-800 mb-3">
                        Your application has been approved! You can now sign in to access your dashboard.
                      </p>
                      <div className="space-y-3">
                        <Button
                          onClick={handleSignIn}
                          className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-medium"
                        >
                          <LogIn className="h-4 w-4 mr-2" />
                          Sign In to Dashboard
                        </Button>
                      </div>
                    </div>
                  )}

                  {application.status === 'rejected' && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h3 className="font-medium text-red-900 mb-2">Application Rejected</h3>
                      <p className="text-sm text-red-800 mb-3">
                        Unfortunately, your application was not approved. You can apply again with corrected information.
                      </p>
                      <div className="space-y-3">
                        <Button
                          onClick={handleGoHome}
                          className="w-full h-10 bg-red-600 hover:bg-red-700 text-white font-medium"
                        >
                          <Home className="h-4 w-4 mr-2" />
                          Apply Again
                        </Button>
                      </div>
                    </div>
                  )}

                  {application.status === 'pending' && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h3 className="font-medium text-yellow-900 mb-2">Application Under Review</h3>
                      <p className="text-sm text-yellow-800 mb-3">
                        Your application is currently being reviewed by our administrators. Please check back later.
                      </p>
                      <div className="space-y-3">
                        <Button
                          onClick={checkApplicationStatus}
                          disabled={checking}
                          variant="outline"
                          className="w-full h-10 border-2 border-yellow-300 hover:border-yellow-400"
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
                          {checking ? 'Checking...' : 'Refresh Status'}
                        </Button>
                        <Button
                          onClick={handleGoHome}
                          variant="outline"
                          className="w-full h-10 border-2 border-gray-300 hover:border-gray-400"
                        >
                          <Home className="h-4 w-4 mr-2" />
                          Go to Homepage
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Application Details */}
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Application Details
                    </h3>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p><strong>Name:</strong> {application.full_name}</p>
                      <p><strong>Admission Number:</strong> {application.admission_number}</p>
                      <p><strong>Class:</strong> {application.classes.course_name}</p>
                      <p><strong>University:</strong> {application.classes.universities.name}</p>
                      <p><strong>Country:</strong> {application.classes.universities.countries.name}</p>
                      <p><strong>Applied:</strong> {formatDate(application.created_at)}</p>
                      {application.updated_at !== application.created_at && (
                        <p><strong>Last Updated:</strong> {formatDate(application.updated_at)}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* No Application Found */}
              {!userProfile && !application && (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">No Application Found</h3>
                    <p className="text-sm text-gray-700 mb-3">
                      We couldn't find any application associated with your email. You may need to submit a new application.
                    </p>
                    <div className="space-y-3">
                      <Button
                        onClick={handleGoHome}
                        className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                      >
                        <Home className="h-4 w-4 mr-2" />
                        Start New Application
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ApplicationStatus;
