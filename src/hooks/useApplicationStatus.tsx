import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ApplicationStatus {
  hasApplication: boolean;
  status: 'pending' | 'approved' | 'rejected' | null;
  applicationId: string | null;
  loading: boolean;
  error: string | null;
}

export const useApplicationStatus = () => {
  const [status, setStatus] = useState<ApplicationStatus>({
    hasApplication: false,
    status: null,
    applicationId: null,
    loading: true,
    error: null
  });

  const { user } = useAuth();
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      setStatus({
        hasApplication: false,
        status: null,
        applicationId: null,
        loading: false,
        error: null
      });
      lastUserIdRef.current = null;
      return;
    }

    // Only check if user changed or we haven't checked yet
    if (lastUserIdRef.current !== user.id) {
      lastUserIdRef.current = user.id;
      checkApplicationStatus();
    }
  }, [user]);

  const checkApplicationStatus = async () => {
    if (!user) return;

    setStatus(prev => ({ ...prev, loading: true, error: null }));

    try {
      // First check if user has a profile with a class assigned (they're approved)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, class_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile && !profileError && profile.class_id) {
        // User has a profile with a class assigned, they are approved
        setStatus({
          hasApplication: true,
          status: 'approved',
          applicationId: profile.id,
          loading: false,
          error: null
        });
        return;
      }

      // If profile doesn't exist (deleted), don't show error, let ProfileGuard handle it
      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist - ProfileGuard will handle logout
        setStatus({
          hasApplication: false,
          status: null,
          applicationId: null,
          loading: false,
          error: null
        });
        return;
      }

      // No profile found, check for pending applications
      const { data: applications, error: applicationError } = await supabase
        .from('applications' as any)
        .select('id, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (applicationError) {
        throw applicationError;
      }

      if (applications && applications.length > 0) {
        const latestApplication = applications[0];
        setStatus({
          hasApplication: true,
          status: (latestApplication as any).status as 'pending' | 'approved' | 'rejected',
          applicationId: latestApplication.id,
          loading: false,
          error: null
        });
      } else {
        setStatus({
          hasApplication: false,
          status: null,
          applicationId: null,
          loading: false,
          error: null
        });
      }
    } catch (error: any) {
      console.error('Error checking application status:', error);
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to check application status'
      }));
    }
  };

  const refreshStatus = () => {
    checkApplicationStatus();
  };

  return {
    ...status,
    refreshStatus
  };
};
