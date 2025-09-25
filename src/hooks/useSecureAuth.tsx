import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLoginRateLimit, useRegisterRateLimit } from './useRateLimit';
import { useInputValidation } from './useInputValidation';
import { useCSRFProtection } from './useCSRFProtection';
import { logSecurityEvent, SECURITY_EVENTS, passwordStrength } from '@/lib/security';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  email: string;
  password: string;
  full_name: string;
}

interface AuthResult {
  success: boolean;
  error?: string;
  user?: any;
}

export const useSecureAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const loginRateLimit = useLoginRateLimit();
  const registerRateLimit = useRegisterRateLimit();
  const { validateEmail, validatePassword, validateName } = useInputValidation();
  const { secureFetch } = useCSRFProtection();

  const secureLogin = useCallback(async (credentials: LoginCredentials): Promise<AuthResult> => {
    try {
      setIsLoading(true);

      // Rate limiting check
      if (!loginRateLimit.recordRequest()) {
        const error = `Too many login attempts. Try again in ${Math.ceil(loginRateLimit.timeUntilReset / 1000)} seconds.`;
        logSecurityEvent(SECURITY_EVENTS.LOGIN_ATTEMPT, {
          email: credentials.email,
          reason: 'Rate limit exceeded',
        }, 'WARN');
        return { success: false, error };
      }

      // Validate inputs
      const emailValidation = validateEmail(credentials.email);
      if (!emailValidation.isValid) {
        logSecurityEvent(SECURITY_EVENTS.LOGIN_ATTEMPT, {
          email: credentials.email,
          reason: 'Invalid email format',
        }, 'WARN');
        return { success: false, error: emailValidation.error };
      }

      const passwordValidation = validatePassword(credentials.password);
      if (!passwordValidation.isValid) {
        logSecurityEvent(SECURITY_EVENTS.LOGIN_ATTEMPT, {
          email: credentials.email,
          reason: 'Invalid password format',
        }, 'WARN');
        return { success: false, error: passwordValidation.error };
      }

      // Attempt login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailValidation.sanitizedValue!,
        password: credentials.password, // Don't sanitize password
      });

      if (error) {
        logSecurityEvent(SECURITY_EVENTS.LOGIN_FAILED, {
          email: credentials.email,
          error: error.message,
        }, 'WARN');
        return { success: false, error: error.message };
      }

      if (data.user) {
        logSecurityEvent(SECURITY_EVENTS.LOGIN_SUCCESS, {
          userId: data.user.id,
          email: credentials.email,
        }, 'INFO');
        
        return { success: true, user: data.user };
      }

      return { success: false, error: 'Login failed' };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      logSecurityEvent(SECURITY_EVENTS.LOGIN_FAILED, {
        email: credentials.email,
        error: errorMessage,
      }, 'ERROR');
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [loginRateLimit, validateEmail, validatePassword]);

  const secureRegister = useCallback(async (credentials: RegisterCredentials): Promise<AuthResult> => {
    try {
      setIsLoading(true);

      // Rate limiting check
      if (!registerRateLimit.recordRequest()) {
        const error = `Too many registration attempts. Try again in ${Math.ceil(registerRateLimit.timeUntilReset / 1000)} seconds.`;
        logSecurityEvent(SECURITY_EVENTS.LOGIN_ATTEMPT, {
          email: credentials.email,
          reason: 'Registration rate limit exceeded',
        }, 'WARN');
        return { success: false, error };
      }

      // Validate inputs
      const emailValidation = validateEmail(credentials.email);
      if (!emailValidation.isValid) {
        return { success: false, error: emailValidation.error };
      }

      const passwordValidation = validatePassword(credentials.password);
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.error };
      }

      const nameValidation = validateName(credentials.full_name);
      if (!nameValidation.isValid) {
        return { success: false, error: nameValidation.error };
      }

      // Check password strength
      const strength = passwordStrength(credentials.password);
      if (strength.score < 4) {
        return { success: false, error: 'Password too weak. ' + strength.feedback.join(', ') };
      }

      // Attempt registration
      const { data, error } = await supabase.auth.signUp({
        email: emailValidation.sanitizedValue!,
        password: credentials.password,
        options: {
          data: {
            full_name: nameValidation.sanitizedValue!,
          }
        }
      });

      if (error) {
        logSecurityEvent(SECURITY_EVENTS.LOGIN_ATTEMPT, {
          email: credentials.email,
          reason: 'Registration failed',
          error: error.message,
        }, 'WARN');
        return { success: false, error: error.message };
      }

      if (data.user) {
        logSecurityEvent(SECURITY_EVENTS.LOGIN_SUCCESS, {
          userId: data.user.id,
          email: credentials.email,
          action: 'registration',
        }, 'INFO');
        
        return { success: true, user: data.user };
      }

      return { success: false, error: 'Registration failed' };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      logSecurityEvent(SECURITY_EVENTS.LOGIN_FAILED, {
        email: credentials.email,
        error: errorMessage,
      }, 'ERROR');
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [registerRateLimit, validateEmail, validatePassword, validateName]);

  const secureSignOut = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        logSecurityEvent(SECURITY_EVENTS.LOGIN_FAILED, {
          action: 'signout',
          error: error.message,
        }, 'ERROR');
        return false;
      }

      logSecurityEvent(SECURITY_EVENTS.LOGIN_SUCCESS, {
        action: 'signout',
      }, 'INFO');
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      logSecurityEvent(SECURITY_EVENTS.LOGIN_FAILED, {
        action: 'signout',
        error: errorMessage,
      }, 'ERROR');
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkPasswordStrength = useCallback((password: string) => {
    return passwordStrength(password);
  }, []);

  return {
    secureLogin,
    secureRegister,
    secureSignOut,
    checkPasswordStrength,
    isLoading,
    loginRateLimit,
    registerRateLimit,
  };
};

export default useSecureAuth;
