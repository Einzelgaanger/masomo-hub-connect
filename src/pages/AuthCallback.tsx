import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/ui/Logo';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Wait for auth state to be determined
        if (loading) return;

        if (!user) {
          // No user found, redirect to login
          navigate('/login');
          return;
        }

        // Check if user already has a profile with a class assigned (they're already approved)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, role, class_id, full_name')
          .eq('user_id', user.id)
          .single();

        if (profile && !profileError && profile.class_id) {
          // User already has a profile with a class assigned, redirect to dashboard
          toast({
            title: "Welcome back!",
            description: `Hi ${profile.full_name}, you're already registered.`,
          });
          navigate('/dashboard');
          return;
        } else if (profile && !profileError && !profile.class_id) {
          // User has a profile but no class assigned, check applications
          console.log('User has profile but no class assigned, checking applications...');
        }

        // Check if user has pending applications
        const { data: applications, error: applicationError } = await supabase
          .from('applications' as any)
          .select('id, status, class_id, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (applicationError) {
          console.error('Error checking applications:', applicationError);
          // If we can't check applications, send them to class selection
          navigate('/class-selection');
          return;
        }

        if (applications && applications.length > 0) {
          const latestApplication = applications[0];
          if (latestApplication.status === 'approved') {
            // Application was approved, redirect to dashboard
            navigate('/dashboard');
            return;
          } else if (latestApplication.status === 'pending') {
            // Application is pending, redirect to status page (stuck state)
            navigate('/application-status');
            return;
          } else if (latestApplication.status === 'rejected') {
            // Check rejection cooldown
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
            } else {
              // Cooldown period has passed, allow re-application
              navigate('/class-selection');
              return;
            }
          }
        }

        // No profile and no applications - new user, send to class selection
        navigate('/class-selection');

      } catch (error) {
        console.error('Auth callback error:', error);
        toast({
          title: "Authentication Error",
          description: "There was an error processing your login. Please try again.",
          variant: "destructive",
        });
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [user, loading, navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <Logo className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bunifu</h1>
          <p className="text-gray-600">Where learning meets creativity</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Processing Login</h2>
          <p className="text-gray-600">
            Please wait while we set up your account...
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
