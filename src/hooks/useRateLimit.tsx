import { useState, useCallback, useRef } from 'react';
import { RATE_LIMITS, logSecurityEvent, SECURITY_EVENTS } from '@/lib/security';

interface RateLimitConfig {
  requests: number;
  window: number;
}

interface RateLimitState {
  requests: number[];
  isBlocked: boolean;
  resetTime: number;
}

const useRateLimit = (config: RateLimitConfig) => {
  const [state, setState] = useState<RateLimitState>({
    requests: [],
    isBlocked: false,
    resetTime: 0,
  });
  
  const lastCleanup = useRef<number>(0);

  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    
    // Clean up old requests every minute
    if (now - lastCleanup.current > 60000) {
      setState(prev => ({
        ...prev,
        requests: prev.requests.filter(time => now - time < config.window),
      }));
      lastCleanup.current = now;
    }

    setState(prev => {
      const recentRequests = prev.requests.filter(time => now - time < config.window);
      
      if (recentRequests.length >= config.requests) {
        const resetTime = recentRequests[0] + config.window;
        
        // Log rate limit violation
        logSecurityEvent(SECURITY_EVENTS.RATE_LIMIT_EXCEEDED, {
          requests: recentRequests.length,
          limit: config.requests,
          window: config.window,
          resetTime,
        }, 'WARN');
        
        return {
          requests: recentRequests,
          isBlocked: true,
          resetTime,
        };
      }
      
      return {
        requests: [...recentRequests, now],
        isBlocked: false,
        resetTime: 0,
      };
    });

    return state.isBlocked;
  }, [config, state.isBlocked]);

  const isAllowed = useCallback((): boolean => {
    return !checkRateLimit();
  }, [checkRateLimit]);

  const recordRequest = useCallback((): boolean => {
    return !checkRateLimit();
  }, [checkRateLimit]);

  const getTimeUntilReset = useCallback((): number => {
    return Math.max(0, state.resetTime - Date.now());
  }, [state.resetTime]);

  return {
    isAllowed,
    recordRequest,
    isBlocked: state.isBlocked,
    timeUntilReset: getTimeUntilReset(),
    requestsRemaining: Math.max(0, config.requests - state.requests.length),
  };
};

// Specific rate limit hooks
export const useLoginRateLimit = () => useRateLimit(RATE_LIMITS.login);
export const useRegisterRateLimit = () => useRateLimit(RATE_LIMITS.register);
export const useUploadRateLimit = () => useRateLimit(RATE_LIMITS.upload);
export const useMessageRateLimit = () => useRateLimit(RATE_LIMITS.message);
export const useGeneralRateLimit = () => useRateLimit(RATE_LIMITS.general);

export default useRateLimit;
