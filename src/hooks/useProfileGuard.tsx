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

        // If profile doesn't exist, wait a bit for profile creation
        if (!profile) {
          console.log('Profile not found, waiting for profile creation...');
          // Don't immediately log out, give time for profile creation
          return;
        }

        // If there's an error accessing the profile (not just missing)
        if (error && error.code !== 'PGRST116') {
          console.log('Error accessing profile, logging out user:', user.id);
          
          // Prevent multiple logout attempts
          if (isNavigatingRef.current) return;
          isNavigatingRef.current = true;
          
          // Show notification
          toast({
            title: "Account Error",
            description: "There was an error accessing your account. Please try again.",
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

    // Wait a bit before checking to allow profile creation
    const initialDelay = setTimeout(() => {
      checkProfileExists();
    }, 2000); // Wait 2 seconds

    // Set up periodic checking (every 30 seconds)
    checkIntervalRef.current = setInterval(checkProfileExists, 30000);

    // Cleanup function
    return () => {
      clearTimeout(initialDelay);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [user, signOut, navigate, toast]);
};
