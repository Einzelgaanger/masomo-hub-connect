import { useCSRFProtection } from '@/hooks/useCSRFProtection';
import { logSecurityEvent, SECURITY_EVENTS } from '@/lib/security';

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

class SecureApiClient {
  private baseUrl: string;
  private defaultTimeout: number = 10000; // 10 seconds
  private maxRetries: number = 3;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.defaultTimeout,
      retries = this.maxRetries,
    } = options;

    const url = `${this.baseUrl}${endpoint}`;
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Prepare headers
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...headers,
      };

      // Add CSRF token if available
      if (typeof window !== 'undefined') {
        const csrfToken = sessionStorage.getItem('csrf_token');
        if (csrfToken) {
          requestHeaders['X-CSRF-Token'] = csrfToken;
        }
      }

      // Prepare request options
      const requestOptions: RequestInit = {
        method,
        headers: requestHeaders,
        credentials: 'same-origin',
        signal: controller.signal,
      };

      // Add body for non-GET requests
      if (body && method !== 'GET') {
        if (body instanceof FormData) {
          delete requestHeaders['Content-Type']; // Let browser set it
          requestOptions.body = body;
        } else {
          requestOptions.body = JSON.stringify(body);
        }
      }

      // Make request with retry logic
      let lastError: Error | null = null;
      
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const response = await fetch(url, requestOptions);
          clearTimeout(timeoutId);

          // Check for CSRF violation
          if (response.status === 403 && response.headers.get('X-CSRF-Violation')) {
            logSecurityEvent(SECURITY_EVENTS.CSRF_VIOLATION, {
              endpoint,
              method,
              attempt: attempt + 1,
            }, 'WARN');
            
            // Refresh CSRF token and retry
            if (attempt < retries) {
              const newCsrfToken = this.generateCSRFToken();
              sessionStorage.setItem('csrf_token', newCsrfToken);
              requestHeaders['X-CSRF-Token'] = newCsrfToken;
              continue;
            }
          }

          // Parse response
          let responseData: any;
          const contentType = response.headers.get('content-type');
          
          if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
          } else {
            responseData = await response.text();
          }

          // Log successful request
          if (response.ok) {
            logSecurityEvent(SECURITY_EVENTS.LOGIN_SUCCESS, {
              endpoint,
              method,
              status: response.status,
            }, 'DEBUG');
          } else {
            logSecurityEvent(SECURITY_EVENTS.LOGIN_FAILED, {
              endpoint,
              method,
              status: response.status,
              error: responseData?.error || responseData,
            }, 'WARN');
          }

          return {
            success: response.ok,
            data: responseData,
            error: response.ok ? undefined : responseData?.error || `HTTP ${response.status}`,
            status: response.status,
          };

        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error');
          
          // Don't retry on certain errors
          if (error instanceof Error && (
            error.name === 'AbortError' ||
            error.message.includes('NetworkError') ||
            error.message.includes('Failed to fetch')
          )) {
            break;
          }

          // Wait before retry (exponential backoff)
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          }
        }
      }

      // All retries failed
      clearTimeout(timeoutId);
      
      logSecurityEvent(SECURITY_EVENTS.LOGIN_FAILED, {
        endpoint,
        method,
        error: lastError?.message || 'Request failed',
        retries,
      }, 'ERROR');

      return {
        success: false,
        error: lastError?.message || 'Request failed',
        status: 0,
      };

    } catch (error) {
      clearTimeout(timeoutId);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logSecurityEvent(SECURITY_EVENTS.LOGIN_FAILED, {
        endpoint,
        method,
        error: errorMessage,
      }, 'ERROR');

      return {
        success: false,
        error: errorMessage,
        status: 0,
      };
    }
  }

  private generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Public API methods
  async get<T>(endpoint: string, options?: Omit<ApiRequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T>(endpoint: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async delete<T>(endpoint: string, options?: Omit<ApiRequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async patch<T>(endpoint: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  // File upload method
  async uploadFile(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.makeRequest(endpoint, {
      method: 'POST',
      body: formData,
      timeout: 60000, // 60 seconds for file uploads
    });
  }
}

// Create singleton instance
export const secureApiClient = new SecureApiClient();

// Export the class for custom instances
export default SecureApiClient;
