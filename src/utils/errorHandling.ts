import { supabase } from '@/integrations/supabase/client';

export interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  timeout?: number;
}

export class NetworkError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'NetworkError';
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, timeout = 10000 } = options;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timeout')), timeout);
      });
      
      // Race between the operation and timeout
      const result = await Promise.race([operation(), timeoutPromise]);
      return result;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      const isRetryableError = isRetryable(error);
      
      if (isLastAttempt || !isRetryableError) {
        throw new NetworkError(
          `Operation failed after ${attempt + 1} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error
        );
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
    }
  }
  
  throw new NetworkError('Operation failed after all retries');
}

function isRetryable(error: any): boolean {
  if (!error) return false;
  
  const message = error.message || error.toString();
  const retryablePatterns = [
    'Failed to fetch',
    'ERR_CONNECTION_TIMED_OUT',
    'timeout',
    'NetworkError',
    'ECONNRESET',
    'ENOTFOUND',
    'ECONNREFUSED'
  ];
  
  return retryablePatterns.some(pattern => 
    message.toLowerCase().includes(pattern.toLowerCase())
  );
}

export async function safeSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: any }> {
  try {
    return await withRetry(queryFn, options);
  } catch (error) {
    console.error('Supabase query failed:', error);
    return {
      data: null,
      error: error instanceof NetworkError ? error.originalError : error
    };
  }
}

export function handleSupabaseError(error: any, fallbackMessage = 'An error occurred'): string {
  if (!error) return fallbackMessage;
  
  // Handle specific Supabase errors
  if (error.code === 'PGRST200') {
    return 'Database schema error. Please contact support.';
  }
  
  if (error.message?.includes('Failed to fetch')) {
    return 'Network connection failed. Please check your internet connection.';
  }
  
  if (error.message?.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  
  return error.message || fallbackMessage;
}

