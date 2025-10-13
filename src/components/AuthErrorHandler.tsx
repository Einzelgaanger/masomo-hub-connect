import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const AuthErrorHandler = () => {
  const { clearAuthData } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Listen for auth errors
    const handleAuthError = (event: any) => {
      if (event.detail?.error?.message?.includes('Invalid Refresh Token')) {
        console.log('Detected invalid refresh token, clearing auth data...');
        clearAuthData();
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
      }
    };

    // Listen for unhandled promise rejections (auth errors)
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('Invalid Refresh Token')) {
        console.log('Detected invalid refresh token in promise rejection, clearing auth data...');
        clearAuthData();
        toast({
          title: "Session Expired", 
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        event.preventDefault(); // Prevent the error from showing in console
      }
    });

    return () => {
      window.removeEventListener('unhandledrejection', handleAuthError);
    };
  }, [clearAuthData, toast]);

  return null; // This component doesn't render anything
};
