import { useProfileGuard } from '@/hooks/useProfileGuard';

interface ProfileGuardProps {
  children: React.ReactNode;
}

const ProfileGuard = ({ children }: ProfileGuardProps) => {
  // This hook will automatically handle logout when profile is deleted
  useProfileGuard();
  
  return <>{children}</>;
};

export default ProfileGuard;
