import React, { createContext, useContext, useEffect, useState } from 'react';
import { useCSRFProtection } from '@/hooks/useCSRFProtection';
import { logSecurityEvent, SECURITY_EVENTS } from '@/lib/security';

interface SecurityContextType {
  csrfToken: string;
  isSecure: boolean;
  reportSecurityEvent: (event: string, details: any) => void;
}

const SecurityContext = createContext<SecurityContextType>({
  csrfToken: '',
  isSecure: false,
  reportSecurityEvent: () => {},
});

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSecure, setIsSecure] = useState(false);
  const { token: csrfToken, isValid } = useCSRFProtection();

  useEffect(() => {
    // Check if we're in a secure context
    const checkSecurity = () => {
      const isHttps = window.location.protocol === 'https:';
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (!isHttps && !isLocalhost) {
        logSecurityEvent(SECURITY_EVENTS.SUSPICIOUS_ACTIVITY, {
          reason: 'Non-HTTPS connection',
          protocol: window.location.protocol,
          hostname: window.location.hostname,
        }, 'WARN');
      }

      setIsSecure(isHttps || isLocalhost);
    };

    checkSecurity();

    // Monitor for security violations
    const handleSecurityViolation = (event: SecurityPolicyViolationEvent) => {
      logSecurityEvent(SECURITY_EVENTS.SUSPICIOUS_ACTIVITY, {
        reason: 'CSP violation',
        violatedDirective: event.violatedDirective,
        blockedURI: event.blockedURI,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber,
      }, 'WARN');
    };

    // Monitor for XSS attempts
    const handleError = (event: ErrorEvent) => {
      if (event.message && (
        event.message.includes('script') ||
        event.message.includes('eval') ||
        event.message.includes('Function') ||
        event.message.includes('setTimeout') ||
        event.message.includes('setInterval')
      )) {
        logSecurityEvent(SECURITY_EVENTS.SUSPICIOUS_ACTIVITY, {
          reason: 'Potential XSS attempt',
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }, 'WARN');
      }
    };

    // Add event listeners
    document.addEventListener('securitypolicyviolation', handleSecurityViolation);
    window.addEventListener('error', handleError);

    // Monitor for suspicious activity
    const handleUnload = () => {
      logSecurityEvent(SECURITY_EVENTS.LOGIN_SUCCESS, {
        action: 'page_unload',
        url: window.location.href,
      }, 'INFO');
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        logSecurityEvent(SECURITY_EVENTS.LOGIN_SUCCESS, {
          action: 'page_hidden',
          url: window.location.href,
        }, 'INFO');
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('securitypolicyviolation', handleSecurityViolation);
      window.removeEventListener('error', handleError);
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const reportSecurityEvent = (event: string, details: any) => {
    logSecurityEvent(event, details);
  };

  return (
    <SecurityContext.Provider
      value={{
        csrfToken,
        isSecure,
        reportSecurityEvent,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

export default SecurityProvider;
