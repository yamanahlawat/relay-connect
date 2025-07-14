import { useCallback, useEffect, useState } from 'react';

interface UseFileDragProps {
  onDrop: (files: File[]) => void;
  fileTypes?: string[]; // Optional: Allow filtering file types
}

export function useFileDrag({ onDrop, fileTypes = [] }: UseFileDragProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer!.dropEffect = 'copy';
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Simply clear dragging state—this avoids issues with relatedTarget
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer!.dropEffect = 'copy';
      setIsDragging(false);

      const dt = e.dataTransfer;
      if (!dt) return;

      // Filter files by allowed types
      const droppedFiles = Array.from(dt.files).filter(
        (file) => fileTypes.length === 0 || fileTypes.some((type) => file.type.startsWith(type))
      );

      if (droppedFiles.length > 0) {
        onDrop(droppedFiles);
      }
    },
    [onDrop, fileTypes]
  );

  useEffect(() => {
    // Use window instead of document to help ensure events fire reliably.
    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleDragEnter, handleDragOver, handleDragLeave, handleDrop]);

  return { isDragging };
}
