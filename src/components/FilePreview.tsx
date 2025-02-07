import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

interface FileOrUrl {
  id: string;
  url?: string;
  name: string;
}

interface FilePreviewProps {
  files: (File | FileOrUrl)[];
  onRemove?: (file: File | FileOrUrl) => void;
  showPreview?: boolean;
  imageSize?: 'sm' | 'lg';
}

const SIZE_CONFIG = {
  sm: { width: 80, height: 80, className: 'h-20 w-20' },
  lg: { width: 112, height: 112, className: 'h-28 w-28' },
};

export const FilePreview = React.memo(function FilePreview({
  files,
  onRemove,
  showPreview = false,
  imageSize = 'sm',
}: FilePreviewProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Memoize object URLs for File instances
  const objectUrls = useMemo(
    () => files.map((file) => (file instanceof File ? URL.createObjectURL(file) : (file as FileOrUrl).url || '')),
    [files]
  );

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      objectUrls.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [objectUrls]);

  // Use callbacks to avoid re-creation of handlers on each render
  const handleNext = useCallback(() => setSelectedIndex((prev) => (prev + 1) % files.length), [files]);
  const handlePrev = useCallback(() => setSelectedIndex((prev) => (prev - 1 + files.length) % files.length), [files]);

  const getFileName = useCallback((file: File | FileOrUrl) => {
    return file instanceof File ? file.name : file.name;
  }, []);

  const getFileUrl = useCallback(
    (file: File | FileOrUrl, index: number) => (file instanceof File ? objectUrls[index] : file.url),
    [objectUrls]
  );

  const currentFile = files[selectedIndex];
  const currentUrl = getFileUrl(currentFile, selectedIndex);
  const currentFileName = getFileName(currentFile);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        setPreviewOpen(false);
      }
    },
    [handleNext, handlePrev]
  );

  const imageDimensions = useMemo(() => SIZE_CONFIG[imageSize] || SIZE_CONFIG.sm, [imageSize]);

  // For thumbnails: if more than 4 files exist, show the first 4 and a special overlay thumbnail
  const showOverlayThumbnail = files.length > 4;
  const visibleFiles = showOverlayThumbnail ? files.slice(0, 4) : files;
  // The count of remaining images is (total files - 4)
  const remainingCount = showOverlayThumbnail ? files.length - 4 : 0;

  // Click handler for preview thumbnails
  const handlePreviewOpen = (index: number) => {
    if (showPreview) {
      setSelectedIndex(index);
      setPreviewOpen(true);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 p-2">
        {visibleFiles.map((file, index) => (
          <div key={index} className="group relative">
            <Image
              src={getFileUrl(file, index) || ''}
              alt={getFileName(file)}
              width={imageDimensions.width}
              height={imageDimensions.height}
              sizes={`(max-width: 640px) ${imageDimensions.width}px, ${imageDimensions.height}px`}
              className={cn(
                'rounded-md border object-cover',
                imageDimensions.className,
                showPreview && 'cursor-pointer hover:opacity-90'
              )}
              onClick={() => handlePreviewOpen(index)}
              priority
            />
            {onRemove && (
              <button
                onClick={() => onRemove(file)}
                className="absolute -right-2 -top-2 rounded-full bg-background p-0.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}

        {showOverlayThumbnail && (
          <div className="group relative">
            <Image
              src={getFileUrl(files[4], 4) || ''}
              alt={getFileName(files[4])}
              width={imageDimensions.width}
              height={imageDimensions.height}
              sizes={`(max-width: 640px) ${imageDimensions.width}px, ${imageDimensions.height}px`}
              className={cn(
                'rounded-md border object-cover',
                imageDimensions.className,
                showPreview && 'cursor-pointer hover:opacity-90'
              )}
              onClick={() => handlePreviewOpen(4)}
              priority
            />
            <div
              className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black bg-opacity-50 text-lg font-semibold text-white"
              onClick={() => handlePreviewOpen(4)}
            >
              +{remainingCount}
            </div>
            {onRemove && (
              <button
                onClick={() => onRemove(files[4])}
                className="absolute -right-2 -top-2 rounded-full bg-background p-0.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogTitle />
        <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted/30" onKeyDown={handleKeyDown}>
            <Image src={currentUrl || ''} alt={currentFileName} fill className="object-contain" priority />

            {files.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between p-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
            )}

            <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/60 p-4 text-white">
              <p className="text-sm font-medium">{currentFileName}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});
