import { ImagePlus } from 'lucide-react';

interface FileDropOverlayProps {
  isOver?: boolean;
}

export function FileDropOverlay({ isOver }: FileDropOverlayProps) {
  if (!isOver) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <ImagePlus className="h-8 w-8 animate-pulse" />
        <p className="text-sm font-medium">Drop files here to add to chat</p>
      </div>
    </div>
  );
}
