import { FileAudio, File as FileIcon, FileImage, FileText, FileVideo, type LucideIcon } from 'lucide-react';

export type FileCategory = 'image' | 'video' | 'audio' | 'document' | 'unknown';

/**
 * Determines the file category based on MIME type or filename
 */
export function getFileCategory(mimeTypeOrFilename: string): FileCategory {
  // If it looks like a MIME type
  if (mimeTypeOrFilename.includes('/')) {
    if (mimeTypeOrFilename.startsWith('image/')) return 'image';
    if (mimeTypeOrFilename.startsWith('video/')) return 'video';
    if (mimeTypeOrFilename.startsWith('audio/')) return 'audio';

    // Document types
    if (
      mimeTypeOrFilename.startsWith('text/') ||
      mimeTypeOrFilename.includes('pdf') ||
      mimeTypeOrFilename.includes('document') ||
      mimeTypeOrFilename.includes('sheet') ||
      mimeTypeOrFilename.includes('presentation') ||
      mimeTypeOrFilename.includes('json') ||
      mimeTypeOrFilename.includes('xml') ||
      mimeTypeOrFilename.includes('csv')
    ) {
      return 'document';
    }
  } else {
    // Filename-based detection
    const extension = getFileExtension(mimeTypeOrFilename).toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      return 'image';
    }
    if (['mp4', 'webm', 'mov', 'avi'].includes(extension)) {
      return 'video';
    }
    if (['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(extension)) {
      return 'audio';
    }
    if (
      ['pdf', 'txt', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'json', 'html', 'css', 'js', 'xml'].includes(
        extension
      )
    ) {
      return 'document';
    }
  }

  return 'unknown';
}

/**
 * Gets the appropriate icon for a file category
 */
export function getFileIcon(category: FileCategory): LucideIcon {
  switch (category) {
    case 'image':
      return FileImage;
    case 'video':
      return FileVideo;
    case 'audio':
      return FileAudio;
    case 'document':
      return FileText;
    default:
      return FileIcon;
  }
}

/**
 * Gets a color class for a file category
 */
export function getFileColor(category: FileCategory): string {
  switch (category) {
    case 'image':
      return 'text-green-600 dark:text-green-400';
    case 'video':
      return 'text-blue-600 dark:text-blue-400';
    case 'audio':
      return 'text-purple-600 dark:text-purple-400';
    case 'document':
      return 'text-orange-600 dark:text-orange-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}

/**
 * Checks if a file can be previewed (currently only images)
 */
export function canPreviewFile(category: FileCategory): boolean {
  return category === 'image';
}

/**
 * Gets file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.slice(lastDot + 1).toUpperCase() : '';
}
