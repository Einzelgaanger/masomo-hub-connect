import { useState, useCallback } from 'react';
import { VALIDATION_SCHEMAS, sanitizeInput, logSecurityEvent, SECURITY_EVENTS } from '@/lib/security';
import { z } from 'zod';

interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: string;
}

export const useInputValidation = () => {
  const validateField = useCallback((
    value: string,
    schema: z.ZodString,
    fieldName: string
  ): ValidationResult => {
    try {
      // Sanitize input first
      const sanitized = sanitizeInput(value);
      
      // Validate with schema
      const result = schema.safeParse(sanitized);
      
      if (!result.success) {
        const error = result.error.errors[0]?.message || 'Invalid input';
        
        // Log validation failure
        logSecurityEvent(SECURITY_EVENTS.INVALID_INPUT, {
          field: fieldName,
          value: value.substring(0, 100), // Log first 100 chars only
          error,
        }, 'WARN');
        
        return { isValid: false, error };
      }
      
      return { isValid: true, sanitizedValue: sanitized };
    } catch (error) {
      logSecurityEvent(SECURITY_EVENTS.INVALID_INPUT, {
        field: fieldName,
        error: 'Validation error',
      }, 'ERROR');
      
      return { isValid: false, error: 'Validation failed' };
    }
  }, []);

  const validateEmail = useCallback((email: string): ValidationResult => {
    return validateField(email, VALIDATION_SCHEMAS.email, 'email');
  }, [validateField]);

  const validatePassword = useCallback((password: string): ValidationResult => {
    return validateField(password, VALIDATION_SCHEMAS.password, 'password');
  }, [validateField]);

  const validateName = useCallback((name: string): ValidationResult => {
    return validateField(name, VALIDATION_SCHEMAS.name, 'name');
  }, [validateField]);

  const validateTitle = useCallback((title: string): ValidationResult => {
    return validateField(title, VALIDATION_SCHEMAS.title, 'title');
  }, [validateField]);

  const validateDescription = useCallback((description: string): ValidationResult => {
    return validateField(description, VALIDATION_SCHEMAS.description, 'description');
  }, [validateField]);

  const validatePhone = useCallback((phone: string): ValidationResult => {
    return validateField(phone, VALIDATION_SCHEMAS.phone, 'phone');
  }, [validateField]);

  const validateUrl = useCallback((url: string): ValidationResult => {
    return validateField(url, VALIDATION_SCHEMAS.url, 'url');
  }, [validateField]);

  const validateFile = useCallback((file: File): ValidationResult => {
    try {
      // Check file size
      const sizeResult = VALIDATION_SCHEMAS.fileSize.safeParse(file.size);
      if (!sizeResult.success) {
        return { isValid: false, error: 'File too large' };
      }

      // Check file name
      const nameResult = VALIDATION_SCHEMAS.fileName.safeParse(file.name);
      if (!nameResult.success) {
        return { isValid: false, error: 'Invalid file name' };
      }

      // Check file type
      const allowedTypes = [
        ...VALIDATION_SCHEMAS.ALLOWED_FILE_TYPES.images,
        ...VALIDATION_SCHEMAS.ALLOWED_FILE_TYPES.documents,
        ...VALIDATION_SCHEMAS.ALLOWED_FILE_TYPES.archives,
        ...VALIDATION_SCHEMAS.ALLOWED_FILE_TYPES.text,
      ];

      if (!allowedTypes.includes(file.type)) {
        logSecurityEvent(SECURITY_EVENTS.INVALID_INPUT, {
          field: 'file',
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }, 'WARN');
        
        return { isValid: false, error: 'File type not allowed' };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'File validation failed' };
    }
  }, []);

  const validateForm = useCallback((data: Record<string, any>): {
    isValid: boolean;
    errors: Record<string, string>;
    sanitizedData: Record<string, any>;
  } => {
    const errors: Record<string, string> = {};
    const sanitizedData: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        const sanitized = sanitizeInput(value);
        sanitizedData[key] = sanitized;
        
        // Basic validation for common fields
        if (key === 'email') {
          const result = validateEmail(sanitized);
          if (!result.isValid) errors[key] = result.error!;
        } else if (key === 'password') {
          const result = validatePassword(sanitized);
          if (!result.isValid) errors[key] = result.error!;
        } else if (key === 'name' || key === 'full_name') {
          const result = validateName(sanitized);
          if (!result.isValid) errors[key] = result.error!;
        } else if (key === 'title') {
          const result = validateTitle(sanitized);
          if (!result.isValid) errors[key] = result.error!;
        } else if (key === 'description') {
          const result = validateDescription(sanitized);
          if (!result.isValid) errors[key] = result.error!;
        }
      } else {
        sanitizedData[key] = value;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedData,
    };
  }, [validateEmail, validatePassword, validateName, validateTitle, validateDescription]);

  return {
    validateEmail,
    validatePassword,
    validateName,
    validateTitle,
    validateDescription,
    validatePhone,
    validateUrl,
    validateFile,
    validateForm,
    sanitizeInput,
  };
};

export default useInputValidation;
