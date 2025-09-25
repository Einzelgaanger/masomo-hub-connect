import { useState, useCallback } from 'react';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZES, logSecurityEvent, SECURITY_EVENTS } from '@/lib/security';
import { useUploadRateLimit } from './useRateLimit';
import { useInputValidation } from './useInputValidation';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileId?: string;
}

export const useSecureFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percentage: 0 });
  const [error, setError] = useState<string | null>(null);
  
  const rateLimit = useUploadRateLimit();
  const { validateFile } = useInputValidation();

  const validateFileType = useCallback((file: File): boolean => {
    const allAllowedTypes = [
      ...ALLOWED_FILE_TYPES.images,
      ...ALLOWED_FILE_TYPES.documents,
      ...ALLOWED_FILE_TYPES.archives,
      ...ALLOWED_FILE_TYPES.text,
    ];
    
    return allAllowedTypes.includes(file.type);
  }, []);

  const validateFileSize = useCallback((file: File): boolean => {
    if (ALLOWED_FILE_TYPES.images.includes(file.type)) {
      return file.size <= MAX_FILE_SIZES.images;
    }
    if (ALLOWED_FILE_TYPES.documents.includes(file.type)) {
      return file.size <= MAX_FILE_SIZES.documents;
    }
    if (ALLOWED_FILE_TYPES.archives.includes(file.type)) {
      return file.size <= MAX_FILE_SIZES.archives;
    }
    if (ALLOWED_FILE_TYPES.text.includes(file.type)) {
      return file.size <= MAX_FILE_SIZES.text;
    }
    
    return false;
  }, []);

  const scanFileForMalware = useCallback(async (file: File): Promise<boolean> => {
    // Basic file content scanning
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      
      // Check for suspicious patterns
      const suspiciousPatterns = [
        [0x4D, 0x5A], // PE executable header
        [0x7F, 0x45, 0x4C, 0x46], // ELF header
        [0xFE, 0xED, 0xFA, 0xCE], // Mach-O header
      ];
      
      for (const pattern of suspiciousPatterns) {
        for (let i = 0; i <= bytes.length - pattern.length; i++) {
          let match = true;
          for (let j = 0; j < pattern.length; j++) {
            if (bytes[i + j] !== pattern[j]) {
              match = false;
              break;
            }
          }
          if (match) {
            logSecurityEvent(SECURITY_EVENTS.SUSPICIOUS_ACTIVITY, {
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              pattern: pattern.map(b => b.toString(16)).join(' '),
            }, 'WARN');
            return false;
          }
        }
      }
      
      return true;
    } catch (error) {
      logSecurityEvent(SECURITY_EVENTS.SUSPICIOUS_ACTIVITY, {
        fileName: file.name,
        error: 'File scan failed',
      }, 'ERROR');
      return false;
    }
  }, []);

  const uploadFile = useCallback(async (
    file: File,
    bucket: string = 'uploads',
    path?: string
  ): Promise<UploadResult> => {
    try {
      setIsUploading(true);
      setError(null);
      setProgress({ loaded: 0, total: 0, percentage: 0 });

      // Rate limiting check
      if (!rateLimit.recordRequest()) {
        const error = `Rate limit exceeded. Try again in ${Math.ceil(rateLimit.timeUntilReset / 1000)} seconds.`;
        setError(error);
        return { success: false, error };
      }

      // Validate file
      const validation = validateFile(file);
      if (!validation.isValid) {
        const error = validation.error || 'File validation failed';
        setError(error);
        return { success: false, error };
      }

      // Validate file type
      if (!validateFileType(file)) {
        const error = 'File type not allowed';
        setError(error);
        logSecurityEvent(SECURITY_EVENTS.INVALID_INPUT, {
          fileName: file.name,
          fileType: file.type,
          reason: 'Type not allowed',
        }, 'WARN');
        return { success: false, error };
      }

      // Validate file size
      if (!validateFileSize(file)) {
        const error = 'File too large';
        setError(error);
        logSecurityEvent(SECURITY_EVENTS.INVALID_INPUT, {
          fileName: file.name,
          fileSize: file.size,
          reason: 'Size exceeded',
        }, 'WARN');
        return { success: false, error };
      }

      // Scan for malware
      const isSafe = await scanFileForMalware(file);
      if (!isSafe) {
        const error = 'File rejected for security reasons';
        setError(error);
        return { success: false, error };
      }

      // Generate secure filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop();
      const secureFileName = `${timestamp}_${randomId}.${extension}`;
      
      const filePath = path ? `${path}/${secureFileName}` : secureFileName;

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      formData.append('path', filePath);

      // Upload with progress tracking
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
      });

      if (!response.ok) {
        const error = `Upload failed: ${response.statusText}`;
        setError(error);
        return { success: false, error };
      }

      const result = await response.json();
      
      if (!result.success) {
        setError(result.error || 'Upload failed');
        return { success: false, error: result.error };
      }

      // Log successful upload
      logSecurityEvent(SECURITY_EVENTS.FILE_UPLOAD, {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        bucket,
        path: filePath,
      }, 'INFO');

      setProgress({ loaded: file.size, total: file.size, percentage: 100 });
      
      return {
        success: true,
        url: result.url,
        fileId: result.fileId,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(errorMessage);
      
      logSecurityEvent(SECURITY_EVENTS.FILE_UPLOAD, {
        fileName: file.name,
        error: errorMessage,
      }, 'ERROR');
      
      return { success: false, error: errorMessage };
    } finally {
      setIsUploading(false);
    }
  }, [rateLimit, validateFile, validateFileType, validateFileSize, scanFileForMalware]);

  const uploadMultipleFiles = useCallback(async (
    files: File[],
    bucket: string = 'uploads',
    path?: string
  ): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];
    
    for (const file of files) {
      const result = await uploadFile(file, bucket, path);
      results.push(result);
      
      // If any upload fails, stop the process
      if (!result.success) {
        break;
      }
    }
    
    return results;
  }, [uploadFile]);

  const deleteFile = useCallback(async (fileId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/upload/${fileId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        logSecurityEvent(SECURITY_EVENTS.FILE_UPLOAD, {
          fileId,
          error: 'Delete failed',
        }, 'ERROR');
        return false;
      }

      logSecurityEvent(SECURITY_EVENTS.FILE_UPLOAD, {
        fileId,
        action: 'delete',
      }, 'INFO');

      return true;
    } catch (error) {
      logSecurityEvent(SECURITY_EVENTS.FILE_UPLOAD, {
        fileId,
        error: error instanceof Error ? error.message : 'Delete failed',
      }, 'ERROR');
      return false;
    }
  }, []);

  return {
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    isUploading,
    progress,
    error,
    rateLimit,
  };
};

export default useSecureFileUpload;
