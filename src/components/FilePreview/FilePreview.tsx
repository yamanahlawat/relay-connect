import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { FilePreviewProps } from '@/types/attachment';
import { DialogTitle } from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import React, { useCallback, useEffect, useState } from 'react';
import FilePreviewItem from './FilePreviewItem';

const FilePreview = React.memo(function FilePreview({
  files,
  onRemove,
  showPreview = false,
  imageSize = 'sm',
}: FilePreviewProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleNext = useCallback(() => setSelectedIndex((prev) => (prev + 1) % files.length), [files.length]);

  const handlePrev = useCallback(
    () => setSelectedIndex((prev) => (prev - 1 + files.length) % files.length),
    [files.length]
  );

  // Add keyboard navigation when the preview dialog is open.
  useEffect(() => {
    if (!previewOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewOpen, handleNext, handlePrev]);

  // Show only first 4 thumbnails; if more, show overlay.
  const maxVisible = 4;
  const showOverlay = files.length > maxVisible;
  const visibleFiles = showOverlay ? files.slice(0, maxVisible) : files;
  const remainingCount = showOverlay ? files.length - maxVisible : 0;

  const handlePreviewOpen = (index: number) => {
    if (showPreview) {
      setSelectedIndex(index);
      setPreviewOpen(true);
    }
  };

  const currentFile = files[selectedIndex];

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

        {showOverlay && (
          <div className="relative cursor-pointer" onClick={() => handlePreviewOpen(maxVisible)}>
            <FilePreviewItem file={files[maxVisible]!} imageSize={imageSize} />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
              +{remainingCount}
            </div>
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      {showPreview && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogTitle />
          <DialogContent className="max-w-4xl gap-0 overflow-hidden p-0">
            <div className="p-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                {currentFile && (
                  <Image
                    src={currentFile.absolute_url}
                    alt={currentFile.file_name}
                    fill
                    className="object-contain"
                    priority
                  />
                )}

                {files.length > 1 && (
                  <div className="absolute inset-0 flex items-center justify-between p-4">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrev();
                      }}
                      size="icon"
                      variant="default"
                      className="rounded-full"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNext();
                      }}
                      size="icon"
                      variant="default"
                      className="rounded-full"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>
              {currentFile && (
                <p className="mt-2 break-words px-4 text-center text-xs font-medium text-foreground">
                  {currentFile.file_name}
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
});

export default FilePreview;
