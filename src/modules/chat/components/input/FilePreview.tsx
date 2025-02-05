import { X } from 'lucide-react';
import Image from 'next/image';

interface FilePreviewProps {
  files: File[];
  onRemove: (file: File) => void;
}

export function FilePreview({ files, onRemove }: FilePreviewProps) {
  return (
    <div className="flex flex-wrap gap-2 p-2">
      {files.map((file) => (
        <div key={file.name} className="group relative">
          <Image
            src={URL.createObjectURL(file)}
            alt={file.name}
            width={80}
            height={80}
            className="h-20 w-20 rounded-md border object-cover"
          />
          <button
            onClick={() => onRemove(file)}
            className="absolute -right-2 -top-2 rounded-full bg-background p-0.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
