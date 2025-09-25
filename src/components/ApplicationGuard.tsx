import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useApplicationStatus } from '@/hooks/useApplicationStatus';
import { useToast } from '@/hooks/use-toast';

interface ApplicationGuardProps {
  children: React.ReactNode;
}

const ApplicationGuard = ({ children }: ApplicationGuardProps) => {
  const { user } = useAuth();
  const { hasApplication, status, loading } = useApplicationStatus();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Don't redirect if still loading or user not authenticated
    if (loading || !user) return;

    // If user is approved (has profile), let them through immediately
    if (status === 'approved') {
      return;
    }

    // If user has no application, let them through (they might need to apply)
    if (!hasApplication) return;

    // If user has pending or rejected application, redirect to status page
    if (status === 'pending' || status === 'rejected') {
      toast({
        title: "Application Status Required",
        description: "Please check your application status before accessing this page.",
        variant: "default",
      });
      navigate('/application-status');
      return;
    }
  }, [user, hasApplication, status, loading, navigate, toast]);

  // Show loading while checking application status (only for non-approved users)
  if (loading && status !== 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking application status...</p>
        </div>
      </div>
    );
  }

  // Don't render children if user should be redirected
  if (user && hasApplication && (status === 'pending' || status === 'rejected')) {
    return null;
  }

  return <>{children}</>;
};

export default ApplicationGuard;
