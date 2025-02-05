import { useCallback, useEffect, useState } from 'react';

interface UseFileDragProps {
  onDrop: (files: File[]) => void;
  fileTypes?: string[]; // Optional: Allow filtering file types
}

export function useFileDrag({ onDrop, fileTypes = ['image/'] }: UseFileDragProps) {
  const [isDragging, setIsDragging] = useState(false);

  // Handles when a file is dragged into the window
  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  // Handles when a file is being dragged over a drop area
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  }, []);

  // Handles when a file is dragged out of the window or drop area
  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  // Handles when a file is dropped
  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      // Filter allowed file types
      const files = Array.from(e.dataTransfer.files).filter((file) =>
        fileTypes.some((type) => file.type.startsWith(type))
      );

      if (files.length > 0) {
        onDrop(files);
      }
    },
    [onDrop, fileTypes]
  );

  // Attach global listeners to track drag events across the entire app
  useEffect(() => {
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
    };
  }, [handleDragEnter, handleDragOver, handleDragLeave, handleDrop]);

  return { isDragging };
}
