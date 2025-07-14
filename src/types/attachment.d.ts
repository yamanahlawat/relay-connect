import type { components } from '@/lib/api/schema';

type AttachmentRead = components['schemas']['AttachmentRead'];

export interface FilePreviewData {
  /** Unique identifier (may be undefined for files that are still uploading) */
  id?: string;
  /** File name (used for the alt text and caption) */
  file_name: string;
  /** URL used to display the image */
  absolute_url: string;
  /** Upload status */
  status: 'uploading' | 'success' | 'error';
}

// Alias for FilePreviewData to maintain compatibility
export type FileMetadata = FilePreviewData;

export interface FilePreviewProps {
  files: FilePreviewData[];
  onRemove?: (metadata: FileMetadata) => void;
  showPreview?: boolean;
  imageSize?: 'sm' | 'lg';
}

export interface UploadFile {
  id: string;
  file: File;
  absolute_url: string;
  status: string;
}
