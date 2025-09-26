import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from './use-toast';

export const useProfileGuard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<string | null>(null);
  const isNavigatingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!user) {
      // Clear any existing interval if user is not authenticated
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      lastCheckRef.current = null;
      isNavigatingRef.current = false;
      return;
    }

    // Only start checking if we haven't checked this user yet
    if (lastCheckRef.current === user.id) {
      return;
    }

    lastCheckRef.current = user.id;

    const checkProfileExists = async () => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        // If profile doesn't exist or there's an error accessing it
        if (!profile || error) {
          console.log('Profile not found or deleted, logging out user:', user.id);
          
          // Prevent multiple logout attempts
          if (isNavigatingRef.current) return;
          isNavigatingRef.current = true;
          
          // Show notification
          toast({
            title: "Account Deactivated",
            description: "Your account has been deactivated. You have been logged out.",
            variant: "destructive",
          });

          // Clear any intervals
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
            checkIntervalRef.current = null;
          }

          // Sign out the user
          await signOut();
          
          // Redirect to login
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Error checking profile existence:', error);
        // If there's a network error or other issue, don't logout
        // The user might just have a temporary connection issue
      }
    };

    // Check immediately
    checkProfileExists();

    // Set up periodic checking (every 30 seconds)
    checkIntervalRef.current = setInterval(checkProfileExists, 30000);

    // Cleanup function
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [user, signOut, navigate, toast]);
};
