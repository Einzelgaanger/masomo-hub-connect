// Comprehensive Security Configuration
import { z } from 'zod';

// Security Headers Configuration
export const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https: blob:;
    connect-src 'self' https://*.supabase.co https://*.supabase.com;
    media-src 'self' blob:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
  `.replace(/\s+/g, ' ').trim(),
};

// Rate Limiting Configuration
export const RATE_LIMITS = {
  login: { requests: 5, window: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  register: { requests: 3, window: 60 * 60 * 1000 }, // 3 attempts per hour
  upload: { requests: 10, window: 60 * 60 * 1000 }, // 10 uploads per hour
  message: { requests: 100, window: 60 * 1000 }, // 100 messages per minute
  general: { requests: 1000, window: 60 * 1000 }, // 1000 requests per minute
};

// Input Validation Schemas
export const VALIDATION_SCHEMAS = {
  email: z.string().email().max(254).toLowerCase().trim(),
  password: z.string().min(8).max(128).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number, and special character'
  ),
  name: z.string().min(2).max(100).regex(/^[a-zA-Z\s'-]+$/, 'Invalid characters in name'),
  title: z.string().min(1).max(200).trim(),
  description: z.string().min(1).max(5000).trim(),
  phone: z.string().regex(/^\+?[\d\s-()]{10,15}$/, 'Invalid phone number'),
  url: z.string().url().max(2048),
  fileSize: z.number().max(10 * 1024 * 1024), // 10MB max
  fileName: z.string().regex(/^[a-zA-Z0-9._-]+$/, 'Invalid filename characters'),
};

// File Upload Security
export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  archives: ['application/zip', 'application/x-rar-compressed'],
  text: ['text/plain', 'text/csv'],
};

export const MAX_FILE_SIZES = {
  images: 5 * 1024 * 1024, // 5MB
  documents: 10 * 1024 * 1024, // 10MB
  archives: 50 * 1024 * 1024, // 50MB
  text: 1 * 1024 * 1024, // 1MB
};

// Security Utilities
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const validateCSRFToken = (token: string, sessionToken: string): boolean => {
  return token === sessionToken && token.length === 64;
};

// Password Security
export const passwordStrength = (password: string): {
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push('Use at least 8 characters');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Include lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Include uppercase letters');

  if (/\d/.test(password)) score += 1;
  else feedback.push('Include numbers');

  if (/[^a-zA-Z\d]/.test(password)) score += 1;
  else feedback.push('Include special characters');

  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  return { score, feedback };
};

// Session Security
export const SESSION_CONFIG = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  secure: true,
  httpOnly: true,
  sameSite: 'strict' as const,
  path: '/',
};

// Database Security
export const DB_SECURITY = {
  maxQueryTime: 5000, // 5 seconds max query time
  maxResultSize: 1000, // Max 1000 results per query
  allowedOperations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
};

// Logging Configuration
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
} as const;

export const logSecurityEvent = (event: string, details: any, level: keyof typeof LOG_LEVELS = 'INFO') => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    event,
    details,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    ip: 'client-side', // Will be handled server-side
  };
  
  console.log(`[SECURITY ${level}]`, logEntry);
  
  // In production, send to logging service
  if (process.env.NODE_ENV === 'production') {
    // Send to security monitoring service
    fetch('/api/security/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry),
    }).catch(() => {
      // Silent fail for logging
    });
  }
};

// Security Monitoring
export const SECURITY_EVENTS = {
  LOGIN_ATTEMPT: 'login_attempt',
  LOGIN_FAILED: 'login_failed',
  LOGIN_SUCCESS: 'login_success',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  FILE_UPLOAD: 'file_upload',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  INVALID_INPUT: 'invalid_input',
  CSRF_VIOLATION: 'csrf_violation',
} as const;
