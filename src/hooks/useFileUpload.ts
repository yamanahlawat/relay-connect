import { uploadAttachment } from '@/lib/api/attachment';
import type { FilePreviewData } from '@/types/attachment';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

// Constants for file validation
export const FILE_CONFIG = {
  MAX_SIZE: 20 * 1024 * 1024, // 20MB
  ACCEPTED_TYPES: {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a'],
    document: [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/csv',
      'application/json',
      'text/html',
      'text/css',
      'text/javascript',
      'application/javascript',
      'text/xml',
      'application/xml',
    ],
  },
  ERROR_MESSAGES: {
    SIZE: 'File size should be less than 20MB',
    TYPE: 'File type not supported',
    GENERIC: 'Failed to upload file',
  },
} as const;

// Helper function to determine file type category
export const getFileTypeCategory = (mimeType: string): 'image' | 'video' | 'audio' | 'document' | null => {
  for (const [category, types] of Object.entries(FILE_CONFIG.ACCEPTED_TYPES)) {
    if ((types as readonly string[]).includes(mimeType)) {
      return category as 'image' | 'video' | 'audio' | 'document';
    }
  }
  return null;
};

interface UseFileUploadOptions {
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

/**
 * Our minimal preview type is FilePreviewData:
 *
 * export interface FilePreviewData {
 *   id?: string;
 *   file_name: string;
 *   absolute_url: string;
 *   status: 'uploading' | 'success' | 'error';
 * }
 *
 * For internal purposes we extend it with the original File.
 */
interface InternalFileData extends FilePreviewData {
  file: File;
  error?: string;
}

// A helper to validate files
const validateFile = (file: File): string | null => {
  const fileCategory = getFileTypeCategory(file.type);
  if (!fileCategory) {
    return FILE_CONFIG.ERROR_MESSAGES.TYPE;
  }
  if (file.size > FILE_CONFIG.MAX_SIZE) {
    return FILE_CONFIG.ERROR_MESSAGES.SIZE;
  }
  return null;
};

export function useFileUpload(sessionId: string | undefined, options?: UseFileUploadOptions) {
  const [files, setFiles] = useState<InternalFileData[]>([]);
  const filesRef = useRef<InternalFileData[]>([]);

  // Keep the ref updated with the current files
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // Cleanup blob URLs on unmount (using ref so the effect runs only once)
  useEffect(() => {
    return () => {
      filesRef.current.forEach((file) => {
        if (file.absolute_url.startsWith('blob:')) {
          URL.revokeObjectURL(file.absolute_url);
        }
      });
    };
  }, []);

  const uploadMutation = useMutation({
    mutationFn: async ({ file, folder }: { file: File; folder: string }) => {
      return uploadAttachment(file, folder);
    },
    onSuccess: (response, { file }) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.file === file
            ? {
                ...f,
                id: response.id || f.id,
                status: 'success',
                previewUrl: response.absolute_url,
                absolute_url: response.absolute_url,
              }
            : f
        )
      );
      options?.onSuccess?.();
    },
    onError: (error, { file }) => {
      setFiles((prev) => prev.map((f) => (f.file === file ? { ...f, status: 'error', error: error.message } : f)));
      options?.onError?.(error);
    },
  });

  const uploadFiles = useCallback(
    async (newFiles: File[]) => {
      if (!sessionId) return;

      newFiles.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          options?.onError?.(new Error(error));
          return;
        }

        const previewUrl = URL.createObjectURL(file);
        // Generate a temporary unique id (using name, lastModified, and a random string)
        const tempId = `${file.name}-${file.lastModified}-${Math.random().toString(36).substring(2, 15)}`;

        // Add the file to state with an "uploading" status
        setFiles((prev) => [
          ...prev,
          {
            id: tempId,
            file,
            status: 'uploading',
            previewUrl,
            absolute_url: previewUrl,
            file_name: file.name,
          },
        ]);

        // Start the upload
        uploadMutation.mutate({
          file,
          folder: sessionId,
        });
      });
    },
    [sessionId, uploadMutation, options]
  );

  const removeFile = useCallback((fileData: FilePreviewData) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === fileData.id);
      if (fileToRemove && fileToRemove.absolute_url.startsWith('blob:')) {
        URL.revokeObjectURL(fileToRemove.absolute_url);
      }
      return prev.filter((f) => f.id !== fileData.id);
    });
  }, []);

  const getAttachmentIds = useCallback(() => {
    return files.filter((f) => f.status === 'success' && f.id).map((f) => f.id as string);
  }, [files]);

  const clearFiles = useCallback(() => {
    files.forEach((file) => {
      if (file.absolute_url.startsWith('blob:')) {
        URL.revokeObjectURL(file.absolute_url);
      }
    });
    setFiles([]);
  }, [files]);

  return {
    files, // InternalFileData[] which extends FilePreviewData
    uploadFiles,
    removeFile,
    getAttachmentIds,
    clearFiles,
    isUploading: uploadMutation.isPending,
  };
}
