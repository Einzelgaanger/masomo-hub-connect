import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'super_admin';
}

const AdminGuard = ({ children, requiredRole = 'admin' }: AdminGuardProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (loading) return;

      if (!user) {
        navigate('/admin/login');
        return;
      }

      try {
        // Check user's role in profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error checking admin role:', error);
          toast({
            title: "Error",
            description: "Failed to verify admin access.",
            variant: "destructive",
          });
          navigate('/admin/login');
          return;
        }

        if (!profile) {
          toast({
            title: "Access Denied",
            description: "No profile found. Please contact an administrator.",
            variant: "destructive",
          });
          navigate('/admin/login');
          return;
        }

        // Check if user has required role
        const hasAccess = requiredRole === 'super_admin' 
          ? profile.role === 'super_admin'
          : profile.role === 'admin' || profile.role === 'super_admin';

        if (!hasAccess) {
          toast({
            title: "Access Denied",
            description: `You need ${requiredRole} privileges to access this page.`,
            variant: "destructive",
          });
          navigate('/admin/login');
          return;
        }

        setCheckingRole(false);
      } catch (error) {
        console.error('Admin guard error:', error);
        toast({
          title: "Error",
          description: "Failed to verify admin access.",
          variant: "destructive",
        });
        navigate('/admin/login');
      }
    };

    checkAdminAccess();
  }, [user, loading, navigate, toast, requiredRole]);

  // Show loading while checking authentication and role
  if (loading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminGuard;
