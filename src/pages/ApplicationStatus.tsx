import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Clock, CheckCircle, XCircle, RefreshCw, ArrowLeft } from "lucide-react";
import Logo from "@/components/ui/Logo";

const ApplicationStatus = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<'pending' | 'approved' | 'rejected' | 'none'>('pending');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    checkApplicationStatus();
  }, [user, navigate]);

  const checkApplicationStatus = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Check if user has a profile (approved)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, class_id')
        .eq('user_id', user.id)
        .single();

      if (profile && !profileError) {
        // User has a profile, they are approved
        setApplicationStatus('approved');
        return;
      }

      // Check for pending applications
      const { data: applications, error: applicationError } = await supabase
        .from('applications' as any)
        .select('id, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (applicationError) {
        throw applicationError;
      }

      if (applications && applications.length > 0) {
        const latestApplication = applications[0];
        setApplicationStatus((latestApplication as any).status as 'pending' | 'approved' | 'rejected');
      } else {
        setApplicationStatus('none');
      }
    } catch (error: any) {
      console.error('Error checking application status:', error);
      toast({
        title: "Error",
        description: "Failed to check application status.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    checkApplicationStatus();
  };

  const getStatusIcon = () => {
    switch (applicationStatus) {
      case 'pending':
        return <Clock className="h-8 w-8 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-8 w-8 text-red-600" />;
      default:
        return <Clock className="h-8 w-8 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (applicationStatus) {
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      case 'approved':
        return 'bg-green-50 border-green-200';
      case 'rejected':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusTitle = () => {
    switch (applicationStatus) {
      case 'pending':
        return 'Application Under Review';
      case 'approved':
        return 'Application Approved!';
      case 'rejected':
        return 'Application Rejected';
      default:
        return 'No Application Found';
    }
  };

  const getStatusDescription = () => {
    switch (applicationStatus) {
      case 'pending':
        return 'Your application is being reviewed by the admin. You will be notified once a decision is made. This usually takes 1-2 business days.';
      case 'approved':
        return 'Congratulations! Your application has been approved. You can now access your dashboard and start learning.';
      case 'rejected':
        return 'Your application was rejected. Please check your details and try again with correct information.';
      default:
        return 'No application found. Please submit an application to access the platform.';
    }
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
          <Link to="/" className="inline-block">
            <Logo size="lg" showText={true} className="scale-125 sm:scale-150" />
          </Link>
        </div>

        {/* Application Status Card */}
        <div className="max-w-md mx-auto w-full">
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="space-y-3">
                <div className="flex justify-center">
                  {getStatusIcon()}
                </div>
                <div className="space-y-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 fredoka-bold">
                    {getStatusTitle()}
                  </h1>
                  <p className="text-sm text-gray-600 fredoka-medium">
                    Check the status of your application below
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="px-5 pb-5 space-y-6">
              {/* Status Information */}
              <div className={`p-4 border-2 rounded-lg ${getStatusColor()}`}>
                <p className="text-sm text-gray-700 fredoka-medium leading-relaxed">
                  {getStatusDescription()}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {applicationStatus === 'pending' && (
                  <Button 
                    onClick={handleRefresh}
                    variant="outline"
                    className="w-full h-10 border-2 border-gray-300 hover:border-gray-400 fredoka-medium"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Status
                      </>
                    )}
                  </Button>
                )}

                {applicationStatus === 'approved' && (
                  <Button 
                    onClick={() => navigate('/dashboard')}
                    className="w-full h-10 bg-green-600 hover:bg-green-700 text-white fredoka-semibold"
                  >
                    Go to Dashboard
                  </Button>
                )}

                {applicationStatus === 'rejected' && (
                  <Button 
                    onClick={() => navigate('/class-selection')}
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white fredoka-semibold"
                  >
                    Try Again
                  </Button>
                )}

                {applicationStatus === 'none' && (
                  <Button 
                    onClick={() => navigate('/class-selection')}
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white fredoka-semibold"
                  >
                    Submit Application
                  </Button>
                )}
              </div>

              {/* Additional Help */}
              <div className="pt-4 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-500 fredoka-medium mb-3">
                  Having issues? Contact your administrator for assistance.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 fredoka-medium transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ApplicationStatus;