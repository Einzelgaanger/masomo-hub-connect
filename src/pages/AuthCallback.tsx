import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Wait for auth state to be determined
        if (loading) return;

        if (!user) {
          console.log('No user found, redirecting to login');
          navigate('/login');
          return;
        }

        // Check if user has a profile, create one if they don't
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error checking profile:', profileError);
          navigate('/login');
          return;
        }

        if (!existingProfile) {
          // Create a basic profile for Google OAuth users
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              email: user.email || '',
              role: 'student',
              points: 0,
              rank: 'bronze'
            });

          if (createError) {
            console.error('Error creating profile:', createError);
            // Still redirect to dashboard, profile creation will be handled elsewhere
          }
        }

        // Redirect to dashboard after successful authentication
        console.log('Authentication successful, redirecting to dashboard');
        navigate('/dashboard');
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;