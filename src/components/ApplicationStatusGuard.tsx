import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useApplicationStatus } from '@/hooks/useApplicationStatus';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ApplicationStatusGuardProps {
  children: React.ReactNode;
}

const ApplicationStatusGuard = ({ children }: ApplicationStatusGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const { hasApplication, status, loading: statusLoading } = useApplicationStatus();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [checkingStatus, setCheckingStatus] = useState(false);
  const lastCheckRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If user is null (logged out), don't check application status and clear any stale state
    if (!user) {
      lastCheckRef.current = null;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Don't check if auth or status is still loading
    if (authLoading || statusLoading) return;

    // Additional check: don't proceed if we don't have complete status data
    if (status === undefined || status === null) return;

    // Don't redirect if already on the correct status pages
    const currentPath = location.pathname;
    if (currentPath === '/application-status' || 
        currentPath === '/application-rejected' || 
        currentPath === '/login' || 
        currentPath === '/class-selection') {
      return;
    }

    // Don't check if we just checked this path (prevent rapid-fire checks)
    if (lastCheckRef.current === currentPath) return;
    lastCheckRef.current = currentPath;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Add a small delay to prevent flash during initial load
    timeoutRef.current = setTimeout(() => {
      if (status === 'approved') {
        // User is approved and has a class assigned
        // Only redirect to dashboard if they're on an invalid page (not on any main app page)
        const validPaths = [
          '/dashboard', '/ukumbi', '/events', '/ajira', '/inbox', '/alumni', 
          '/profile', '/settings', '/info', '/units', '/unit'
        ];
        
        // Check if current path is a valid main app page or a sub-page
        const isValidPath = validPaths.some(path => currentPath.startsWith(path));
        
        if (!isValidPath && currentPath !== '/') {
          // Only redirect if they're on an invalid page
          navigate('/dashboard');
        }
      } else if (status === 'pending') {
        // Application is pending - redirect to status page
        navigate('/application-status');
      } else if (status === 'rejected') {
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
            rejectedAt: new Date().toISOString()
          }));
          shouldRedirectToRejected = true;
        }

        if (shouldRedirectToRejected) {
          navigate('/application-rejected');
        }
      } else if (!hasApplication) {
        // No profile and no applications - redirect to class selection
        if (currentPath !== '/class-selection') {
          navigate('/class-selection');
        }
      }
    }, 100); // Small delay to prevent flash

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [user, authLoading, statusLoading, status, hasApplication, location.pathname, navigate]);

  // Show loading while checking application status
  if (authLoading || statusLoading) {
    return <LoadingSpinner message="Checking application status..." variant="fullscreen" />;
  }

  // If no user after auth is loaded, redirect to login
  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  return <>{children}</>;
};

export default ApplicationStatusGuard;
