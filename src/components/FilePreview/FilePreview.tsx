import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import React, { useCallback, useState } from 'react';
import FilePreviewItem, { FileOrUrl } from './FilePreviewItem';

export interface FilePreviewProps {
  files: (File | FileOrUrl)[];
  onRemove?: (file: File | FileOrUrl) => void;
  showPreview?: boolean;
  imageSize?: 'sm' | 'lg';
}

// Custom hook to generate an object URL for a file for the dialog preview.
function useFileUrl(file: File | FileOrUrl): string | null {
  const [url, setUrl] = useState<string | null>(null);
  React.useEffect(() => {
    if (file instanceof File) {
      const objectUrl = URL.createObjectURL(file);
      setUrl(objectUrl);
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    } else {
      setUrl(file.url || null);
    }
  }, [file]);
  return url;
}

const FilePreview: React.FC<FilePreviewProps> = React.memo(function FilePreview({
  files,
  onRemove,
  showPreview = false,
  imageSize = 'sm',
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Navigation handlers for the dialog preview
  const handleNext = useCallback(() => setSelectedIndex((prev) => (prev + 1) % files.length), [files]);
  const handlePrev = useCallback(() => setSelectedIndex((prev) => (prev - 1 + files.length) % files.length), [files]);

  // Helper to get the file name
  const getFileName = useCallback((file: File | FileOrUrl) => {
    return file instanceof File ? file.name : file.name;
  }, []);

  // Show only the first 4 thumbnails; if there are more, show an overlay thumbnail.
  const showOverlayThumbnail = files.length > 4;
  const visibleFiles = showOverlayThumbnail ? files.slice(0, 4) : files;
  const remainingCount = showOverlayThumbnail ? files.length - 4 : 0;

  // Opens the dialog preview if showPreview is true.
  const handlePreviewOpen = (index: number) => {
    if (showPreview) {
      setSelectedIndex(index);
      setPreviewOpen(true);
    }
  };

  // For the dialog preview, get the current file’s URL using the custom hook.
  const currentFile = files[selectedIndex]!;

  const currentUrl = useFileUrl(currentFile);
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

  return (
    <>
      <div className="flex flex-wrap gap-2 p-2">
        {visibleFiles.map((file, index) => (
          <FilePreviewItem
            key={index}
            file={file}
            onRemove={onRemove}
            imageSize={imageSize}
            onClick={() => handlePreviewOpen(index)}
          />
        ))}
        {showOverlayThumbnail && (
          <div className="group relative">
            <FilePreviewItem
              file={files[4]!}
              onRemove={onRemove}
              imageSize={imageSize}
              onClick={() => handlePreviewOpen(4)}
            />
            <div
              className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black bg-opacity-50 text-lg font-semibold text-white"
              onClick={() => handlePreviewOpen(4)}
            >
              +{remainingCount}
            </div>
          </div>
        )}
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogTitle />
        <DialogContent className="max-w-4xl gap-0 overflow-hidden p-0">
          <div className="p-4">
            {/* The image container */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg" onKeyDown={handleKeyDown}>
              {currentUrl ? (
                <Image src={currentUrl} alt={currentFileName} fill className="object-contain" priority />
              ) : null}
              {files.length > 1 && (
                <div className="absolute inset-0 flex items-center justify-between p-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrev();
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200 dark:bg-gray-800/80 dark:hover:bg-gray-700/80"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNext();
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200 dark:bg-gray-800/80 dark:hover:bg-gray-700/80"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  </button>
                </div>
              )}
            </div>
            {/* File name below the preview */}
            <p className="mt-2 break-words px-4 text-center text-sm font-medium text-foreground">{currentFileName}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

export default FilePreview;
