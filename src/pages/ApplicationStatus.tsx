import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Clock, CheckCircle, XCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Application {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  full_name: string;
  admission_number: string;
  created_at: string;
  rejection_reason?: string;
  class_id: string;
}

const ApplicationStatus = () => {
  const { user, loading: authLoading } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    
    if (user) {
      loadApplicationStatus();
    }
  }, [user, authLoading, navigate]);

  const loadApplicationStatus = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Try to fetch from applications table
      let { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // If applications table doesn't exist, handle gracefully
      if (error && error.code === 'PGRST116') {
        console.log('Applications table not found, redirecting to class selection');
        navigate('/class-selection');
        return;
      }

      if (error) {
        if (error.code === 'PGRST116') {
          // No application found, redirect to class selection
          navigate('/class-selection');
          return;
        }
        throw error;
      }

      setApplication(data);

      // If approved, redirect to dashboard
      if (data.status === 'approved') {
        toast({
          title: "Application Approved!",
          description: "Your application has been approved. Welcome to Bunifu!",
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error loading application status:', error);
      toast({
        title: "Error",
        description: "Failed to load application status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetryApplication = () => {
    navigate('/class-selection');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner message="Loading application status..." />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <h2 className="text-xl font-semibold mb-4">No Application Found</h2>
            <p className="text-gray-600 mb-4">You haven't submitted an application yet.</p>
            <Button onClick={() => navigate('/class-selection')}>
              Start Application
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (application.status) {
      case 'pending':
        return <Clock className="h-8 w-8 text-amber-500" />;
      case 'approved':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Clock className="h-8 w-8 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (application.status) {
      case 'pending':
        return <Badge variant="outline" className="text-amber-600 border-amber-300">Pending Review</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-300">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-300">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusMessage = () => {
    switch (application.status) {
      case 'pending':
        return "Your application is being reviewed by the class administrator. Please check back later or wait for an email notification.";
      case 'approved':
        return "Congratulations! Your application has been approved. You can now access your dashboard.";
      case 'rejected':
        return application.rejection_reason || "Your application was not approved. Please try applying again with correct information.";
      default:
        return "Unknown application status.";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Logo className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Status</h1>
          <p className="text-gray-600">Check the status of your class application</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Your Application</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={loadApplicationStatus}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Section */}
            <div className="text-center py-6 border rounded-lg bg-gray-50">
              <div className="flex justify-center mb-4">
                {getStatusIcon()}
              </div>
              <div className="space-y-2">
                {getStatusBadge()}
                <p className="text-gray-700 max-w-md mx-auto">
                  {getStatusMessage()}
                </p>
              </div>
            </div>

            {/* Application Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Application Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-gray-900">{application.full_name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Admission Number</label>
                  <p className="text-gray-900">{application.admission_number}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{user?.email}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Submitted</label>
                  <p className="text-gray-900">
                    {new Date(application.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {application.rejection_reason && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Rejection Reason</label>
                  <div className="mt-1 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-red-800">{application.rejection_reason}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {application.status === 'pending' && (
                <div className="flex-1 text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    We'll notify you via email once your application is reviewed.
                  </p>
                  <p className="text-xs text-gray-500">
                    This usually takes 1-2 business days.
                  </p>
                </div>
              )}
              
              {application.status === 'approved' && (
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="flex-1"
                >
                  Go to Dashboard
                </Button>
              )}
              
              {application.status === 'rejected' && (
                <Button
                  onClick={handleRetryApplication}
                  className="flex-1"
                >
                  Apply Again
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="flex-1"
              >
                Sign Out
              </Button>
            </div>

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

export default ApplicationStatus;