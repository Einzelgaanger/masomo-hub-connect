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
          // Create a basic profile for Google OAuth users using upsert
          // Extract proper name from email or metadata
          const extractNameFromEmail = (email: string) => {
            const emailPrefix = email.split('@')[0];
            // Convert email prefix to proper name format
            // e.g., "john.doe" -> "John Doe", "johndoe" -> "Johndoe"
            return emailPrefix
              .split('.')
              .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
              .join(' ');
          };

          const { error: createError } = await supabase
            .from('profiles')
            .upsert({
              user_id: user.id,
              full_name: user.user_metadata?.full_name || extractNameFromEmail(user.email || '') || 'User',
              email: user.email || '',
              role: 'student',
              points: 0,
              rank: 'bronze'
            }, {
              onConflict: 'user_id'
            });

          if (createError) {
            console.error('Error creating/updating profile:', createError);
            // Still redirect to dashboard, profile creation will be handled elsewhere
          } else {
            console.log('Profile created/updated successfully');
          }
        } else {
          console.log('Profile already exists, continuing...');
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