import { useState, useEffect, useCallback } from 'react';
import { generateCSRFToken, validateCSRFToken, logSecurityEvent, SECURITY_EVENTS } from '@/lib/security';

interface CSRFToken {
  token: string;
  timestamp: number;
}

const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_TOKEN_EXPIRY = 30 * 60 * 1000; // 30 minutes

export const useCSRFProtection = () => {
  const [token, setToken] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(false);

  // Generate or retrieve CSRF token
  const generateToken = useCallback((): string => {
    const newToken = generateCSRFToken();
    const tokenData: CSRFToken = {
      token: newToken,
      timestamp: Date.now(),
    };
    
    try {
      sessionStorage.setItem(CSRF_TOKEN_KEY, JSON.stringify(tokenData));
      setToken(newToken);
      setIsValid(true);
      return newToken;
    } catch (error) {
      console.error('Failed to store CSRF token:', error);
      return '';
    }
  }, []);

  // Validate CSRF token
  const validateToken = useCallback((providedToken: string): boolean => {
    try {
      const storedData = sessionStorage.getItem(CSRF_TOKEN_KEY);
      if (!storedData) {
        logSecurityEvent(SECURITY_EVENTS.CSRF_VIOLATION, {
          reason: 'No stored token',
          providedToken: providedToken.substring(0, 8) + '...',
        }, 'WARN');
        return false;
      }

      const tokenData: CSRFToken = JSON.parse(storedData);
      
      // Check if token is expired
      if (Date.now() - tokenData.timestamp > CSRF_TOKEN_EXPIRY) {
        logSecurityEvent(SECURITY_EVENTS.CSRF_VIOLATION, {
          reason: 'Token expired',
          providedToken: providedToken.substring(0, 8) + '...',
          age: Date.now() - tokenData.timestamp,
        }, 'WARN');
        return false;
      }

      // Validate token
      const isValid = validateCSRFToken(providedToken, tokenData.token);
      
      if (!isValid) {
        logSecurityEvent(SECURITY_EVENTS.CSRF_VIOLATION, {
          reason: 'Token mismatch',
          providedToken: providedToken.substring(0, 8) + '...',
          storedToken: tokenData.token.substring(0, 8) + '...',
        }, 'WARN');
      }
      
      return isValid;
    } catch (error) {
      logSecurityEvent(SECURITY_EVENTS.CSRF_VIOLATION, {
        reason: 'Validation error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'ERROR');
      return false;
    }
  }, []);

  // Refresh token if needed
  const refreshToken = useCallback((): string => {
    try {
      const storedData = sessionStorage.getItem(CSRF_TOKEN_KEY);
      if (storedData) {
        const tokenData: CSRFToken = JSON.parse(storedData);
        
        // If token is still valid, return it
        if (Date.now() - tokenData.timestamp < CSRF_TOKEN_EXPIRY) {
          setToken(tokenData.token);
          setIsValid(true);
          return tokenData.token;
        }
      }
      
      // Generate new token
      return generateToken();
    } catch (error) {
      console.error('Failed to refresh CSRF token:', error);
      return generateToken();
    }
  }, [generateToken]);

  // Clear token
  const clearToken = useCallback(() => {
    sessionStorage.removeItem(CSRF_TOKEN_KEY);
    setToken('');
    setIsValid(false);
  }, []);

  // Initialize token on mount
  useEffect(() => {
    refreshToken();
  }, [refreshToken]);

  // Add CSRF token to requests
  const addCSRFToken = useCallback((headers: Record<string, string> = {}): Record<string, string> => {
    return {
      ...headers,
      'X-CSRF-Token': token,
    };
  }, [token]);

  // Secure fetch with CSRF protection
  const secureFetch = useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const csrfHeaders = addCSRFToken();
    
    const secureOptions: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
        ...csrfHeaders,
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
    };

    const response = await fetch(url, secureOptions);
    
    // Check for CSRF violation in response
    if (response.status === 403 && response.headers.get('X-CSRF-Violation')) {
      logSecurityEvent(SECURITY_EVENTS.CSRF_VIOLATION, {
        reason: 'Server detected CSRF violation',
        url,
        method: options.method || 'GET',
      }, 'WARN');
      
      // Refresh token and retry once
      const newToken = refreshToken();
      if (newToken) {
        const retryOptions = {
          ...secureOptions,
          headers: {
            ...secureOptions.headers,
            'X-CSRF-Token': newToken,
          },
        };
        return fetch(url, retryOptions);
      }
    }
    
    return response;
  }, [addCSRFToken, refreshToken]);

  return {
    token,
    isValid,
    generateToken,
    validateToken,
    refreshToken,
    clearToken,
    addCSRFToken,
    secureFetch,
  };
};

export default useCSRFProtection;
