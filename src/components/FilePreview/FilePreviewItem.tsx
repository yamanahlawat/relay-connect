import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

export interface FileOrUrl {
  id: string;
  url?: string;
  name: string;
}

export interface FilePreviewItemProps {
  file: File | FileOrUrl;
  onRemove?: (file: File | FileOrUrl) => void;
  imageSize: 'sm' | 'lg';
  onClick?: () => void;
}

const SIZE_CONFIG = {
  sm: { width: 80, height: 80, className: 'h-20 w-20' },
  lg: { width: 112, height: 112, className: 'h-28 w-28' },
};

const FilePreviewItem: React.FC<FilePreviewItemProps> = ({ file, onRemove, imageSize, onClick }) => {
  // Initialize as null instead of an empty string.
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const imageDimensions = SIZE_CONFIG[imageSize] || SIZE_CONFIG.sm;
  const fileName = file instanceof File ? file.name : file.name;

  useEffect(() => {
    if (file instanceof File) {
      const url = URL.createObjectURL(file);
      setObjectUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setObjectUrl(file.url || null);
    }
  }, [file]);

  return (
    <div className="group relative">
      {objectUrl && (
        <Image
          src={objectUrl}
          alt={fileName}
          width={imageDimensions.width}
          height={imageDimensions.height}
          className={cn(
            'rounded-md border object-cover',
            imageDimensions.className,
            onClick && 'cursor-pointer hover:opacity-90'
          )}
          onClick={onClick}
          priority
        />
      )}
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(file)}
          className="absolute -right-2 -top-2 rounded-full bg-background p-0.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default FilePreviewItem;
