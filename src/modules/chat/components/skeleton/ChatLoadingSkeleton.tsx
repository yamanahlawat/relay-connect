import { Skeleton } from '@/components/ui/skeleton';

export function ChatLoadingSkeleton() {
  return (
    <div className="flex-1 overflow-auto p-4 md:p-8">
      {/* Center everything by wrapping in a container with mx-auto */}
      <div className="mx-auto w-full max-w-2xl space-y-6">
        {/* User message */}
        <div className="flex gap-3">
          <Skeleton className="h-7 w-7 shrink-0 rounded-full bg-muted/40" /> {/* Avatar */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-16 bg-muted/40" /> {/* Username */}
            <Skeleton className="h-20 w-[80%] bg-muted/40" /> {/* Message content */}
          </div>
        </div>

        {/* Assistant message */}
        <div className="flex gap-3">
          <Skeleton className="h-7 w-7 shrink-0 rounded-full bg-muted/40" /> {/* Avatar */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-20 bg-muted/40" /> {/* Assistant label */}
            <Skeleton className="h-28 w-[90%] bg-muted/40" /> {/* Message content */}
            <div className="flex gap-2">
              <Skeleton className="h-3 w-24 bg-muted/40" /> {/* Timestamp */}
              <Skeleton className="h-3 w-24 bg-muted/40" /> {/* Token count */}
            </div>
          </div>
        </div>

        {/* Tool execution example */}
        <div className="flex gap-3 pl-10">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-24 w-[85%] bg-muted/40" /> {/* Tool result */}
            <Skeleton className="h-16 w-[75%] bg-muted/40" /> {/* Response */}
          </div>
        </div>
      </div>
    </div>
  );
}
