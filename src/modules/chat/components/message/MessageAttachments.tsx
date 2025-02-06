import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { components } from '@/lib/api/schema';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

type AttachmentRead = components['schemas']['AttachmentRead'];

interface MessageAttachmentsProps {
  attachments: AttachmentRead[];
  className?: string;
}

export function MessageAttachments({ attachments, className }: MessageAttachmentsProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!attachments?.length) return null;

  const maxVisible = 5;
  const showExtraOverlay = attachments.length > maxVisible;
  const visibleAttachments = showExtraOverlay ? attachments.slice(0, maxVisible) : attachments;

  const handleNext = () => setSelectedIndex((prev) => (prev + 1) % attachments.length);
  const handlePrev = () => setSelectedIndex((prev) => (prev - 1 + attachments.length) % attachments.length);

  return (
    <>
      <div className={cn('flex gap-2', className)}>
        {visibleAttachments.map((attachment, index) => (
          <button
            aria-label={`View ${attachment.file_name}`}
            key={attachment.id}
            onClick={() => {
              setSelectedIndex(index);
              setPreviewOpen(true);
            }}
            className="relative h-24 w-32 overflow-hidden rounded-lg bg-muted/30 transition-transform hover:scale-[1.02]"
          >
            <Image
              src={attachment.absolute_url}
              alt={attachment.file_name}
              fill
              className="object-cover"
              loading="lazy"
            />

            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 transition-opacity hover:opacity-100">
              <p className="w-full break-words p-2 text-xs font-medium text-white">{attachment.file_name}</p>
            </div>

            {showExtraOverlay && index === maxVisible - 1 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="text-xl font-bold text-white">+{attachments.length - maxVisible}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogTitle></DialogTitle>
        <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none">
          <div
            className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted/30"
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') handleNext();
              if (e.key === 'ArrowLeft') handlePrev();
              if (e.key === 'Escape') setPreviewOpen(false);
            }}
          >
            <Image
              src={attachments[selectedIndex].absolute_url}
              alt={attachments[selectedIndex].file_name}
              fill
              className="object-contain"
              loading="lazy"
            />

            {attachments.length > 1 && (
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
              <p className="text-sm font-medium">{attachments[selectedIndex].file_name}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
