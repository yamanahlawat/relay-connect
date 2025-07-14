import { Button } from '@/components/ui/button';
import { canPreviewFile, getFileCategory, getFileColor, getFileExtension, getFileIcon } from '@/lib/fileUtils';
import { cn } from '@/lib/utils';
import type { FilePreviewData } from '@/types/attachment';
import { Loader2, X } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

export interface FilePreviewItemProps {
  file: FilePreviewData;
  onRemove?: (file: FilePreviewData) => void;
  imageSize: 'sm' | 'lg';
  onClick?: () => void;
}

const SIZE_CONFIG = {
  sm: { width: 80, height: 80, className: 'h-20 w-20' },
  lg: { width: 112, height: 112, className: 'h-28 w-28' },
};

const FilePreviewItem: React.FC<FilePreviewItemProps> = ({ file, onRemove, imageSize, onClick }) => {
  const imageDimensions = SIZE_CONFIG[imageSize] || SIZE_CONFIG.sm;
  const { file_name, absolute_url, status } = file;

  // Get file type information from filename (since we don't have MIME type in FilePreviewData)
  const fileExtension = getFileExtension(file_name);
  const category = getFileCategory(file_name); // We'll infer from filename
  const FileIcon = getFileIcon(category);
  const fileColor = getFileColor(category);
  const isImage = category === 'image';
  const canPreview = canPreviewFile(category);

  return (
    <div className="group relative">
      {absolute_url && (
        <div className="relative">
          {isImage ? (
            <Image
              src={absolute_url}
              alt={file_name}
              width={imageDimensions.width}
              height={imageDimensions.height}
              className={cn(
                'rounded-md border object-cover',
                imageDimensions.className,
                canPreview && onClick && 'cursor-pointer hover:opacity-90',
                status === 'uploading' && 'opacity-50'
              )}
              onClick={status !== 'uploading' && canPreview ? onClick : undefined}
              priority
            />
          ) : (
            <div
              className={cn(
                'bg-muted flex flex-col items-center justify-center rounded-md border p-2',
                imageDimensions.className,
                status === 'uploading' && 'opacity-50'
              )}
            >
              <FileIcon className={cn('mb-1 h-6 w-6', fileColor)} />
              <span className="text-muted-foreground w-full truncate text-center text-xs font-medium">
                {fileExtension}
              </span>
            </div>
          )}
          {status === 'uploading' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="text-primary h-6 w-6 animate-spin" />
            </div>
          )}
          {status === 'error' && (
            <div className="bg-destructive/10 absolute inset-0 flex items-center justify-center rounded-md">
              <span className="text-destructive text-xs font-medium">Upload failed</span>
            </div>
          )}
        </div>
      )}
      {onRemove && status !== 'uploading' && (
        <Button
          type="button"
          onClick={() => onRemove(file)}
          variant="ghost"
          className="bg-background absolute -top-2 -right-2 h-6 w-6 rounded-full p-0.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default FilePreviewItem;
