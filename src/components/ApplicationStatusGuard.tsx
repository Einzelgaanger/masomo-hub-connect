import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ApplicationStatusGuardProps {
  children: React.ReactNode;
}

const ApplicationStatusGuard = ({ children }: ApplicationStatusGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    const checkApplicationStatus = async () => {
      // Don't check if auth is still loading or user is not authenticated
      if (authLoading || !user) return;

      // Don't redirect if already on the correct status pages
      const currentPath = location.pathname;
      if (currentPath === '/application-status' || 
          currentPath === '/application-rejected' || 
          currentPath === '/login' || 
          currentPath === '/class-selection') {
        return;
      }

      setCheckingStatus(true);

      try {
        // Check if user has a profile with a class assigned (approved)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, role, class_id, full_name')
          .eq('user_id', user.id)
          .single();

        if (profile && !profileError && profile.class_id) {
          // User is approved and has a class assigned
          // Redirect to dashboard if not already there
          if (currentPath !== '/dashboard') {
            navigate('/dashboard');
          }
          return;
        }

        // Check for applications
        const { data: applications, error: applicationError } = await supabase
          .from('applications' as any)
          .select('id, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (applicationError && applicationError.code !== 'PGRST116') {
          console.error('Application check error:', applicationError);
          // If we can't check applications, allow navigation
          return;
        }

        if (applications && applications.length > 0) {
          const latestApplication = applications[0];
          
          if (latestApplication.status === 'pending') {
            // Application is pending - redirect to status page
            navigate('/application-status');
            return;
          } else if (latestApplication.status === 'rejected') {
            // Check if rejection cooldown is active
            const rejectionData = localStorage.getItem(`rejection_${user.id}`);
            let shouldRedirectToRejected = false;

            if (rejectionData) {
              const { rejectedAt } = JSON.parse(rejectionData);
              const rejectionTime = new Date(rejectedAt);
              const now = new Date();
              const timeDiff = now.getTime() - rejectionTime.getTime();
              const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
              
              // If less than 7 days have passed, redirect to rejected page
              if (daysDiff < 7) {
                shouldRedirectToRejected = true;
              }
            } else {
              // If no rejection data in localStorage, create it
              localStorage.setItem(`rejection_${user.id}`, JSON.stringify({
                rejectedAt: latestApplication.created_at || new Date().toISOString()
              }));
              shouldRedirectToRejected = true;
            }

            if (shouldRedirectToRejected) {
              navigate('/application-rejected');
              return;
            }
          }
        }

        // No profile and no applications - redirect to class selection
        if (currentPath !== '/class-selection') {
          navigate('/class-selection');
        }

      } catch (error) {
        console.error('Error checking application status:', error);
        // On error, allow navigation to continue
      } finally {
        setCheckingStatus(false);
      }
    };

    checkApplicationStatus();
  }, [user, authLoading, location.pathname, navigate]);

  // Show loading while checking application status
  if (authLoading || checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking application status...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ApplicationStatusGuard;
