import { Button } from '@/components/ui/button';
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

  return (
    <div className="group relative">
      {absolute_url && (
        <div className="relative">
          <Image
            src={absolute_url}
            alt={file_name}
            width={imageDimensions.width}
            height={imageDimensions.height}
            className={cn(
              'rounded-md border object-cover',
              imageDimensions.className,
              onClick && 'cursor-pointer hover:opacity-90',
              status === 'uploading' && 'opacity-50'
            )}
            onClick={status !== 'uploading' ? onClick : undefined}
            priority
          />
          {status === 'uploading' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {status === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-destructive/10">
              <span className="text-xs font-medium text-destructive">Upload failed</span>
            </div>
          )}
        </div>
      )}
      {onRemove && status !== 'uploading' && (
        <Button
          type="button"
          onClick={() => onRemove(file)}
          variant="ghost"
          className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-background p-0.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default FilePreviewItem;
