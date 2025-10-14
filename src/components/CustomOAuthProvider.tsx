import React from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CustomOAuthProviderProps {
  children: React.ReactNode;
}

export const CustomOAuthProvider: React.FC<CustomOAuthProviderProps> = ({ children }) => {
  const handleGoogleAuth = async () => {
    try {
      // Custom OAuth configuration with Bunifu branding
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            hd: 'bunifu.world', // Custom domain hint
            login_hint: 'bunifu.world' // Additional domain hint
          },
          scopes: 'openid email profile',
          // Custom branding parameters
          customParameters: {
            'hd': 'bunifu.world',
            'prompt': 'consent',
            'access_type': 'offline'
          }
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Custom OAuth error:', error);
      throw error;
    }
  };

  return (
    <div className="custom-oauth-provider">
      {children}
      <style jsx>{`
        .custom-oauth-provider {
          /* Custom styling for OAuth flow */
        }
      `}</style>
    </div>
  );
};

export default CustomOAuthProvider;
