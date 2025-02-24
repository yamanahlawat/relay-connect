import { Skeleton } from '@/components/ui/skeleton';

export function ChatLoadingSkeleton() {
  return (
    <div className="flex h-full flex-col">
      {/* Message list area */}
      <div className="flex-1 p-4 md:p-8">
        {/* Center everything by wrapping in a container with mx-auto */}
        <div className="mx-auto w-full max-w-2xl space-y-6">
          {/* User message */}
          <div className="flex gap-3">
            <Skeleton className="h-7 w-7 rounded-full" /> {/* Avatar */}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-16" /> {/* Username */}
              <Skeleton className="h-20 w-[80%]" /> {/* Message content */}
            </div>
          </div>

          {/* Assistant message */}
          <div className="flex gap-3">
            <Skeleton className="h-7 w-7 rounded-full" /> {/* Avatar */}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-20" /> {/* Assistant label */}
              <Skeleton className="h-28 w-[90%]" /> {/* Message content */}
              <div className="flex gap-2">
                <Skeleton className="h-3 w-24" /> {/* Timestamp */}
                <Skeleton className="h-3 w-24" /> {/* Token count */}
              </div>
            </div>
          </div>

          {/* Tool execution example */}
          <div className="flex gap-3 pl-10">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-24 w-[85%]" /> {/* Tool result */}
              <Skeleton className="h-16 w-[75%]" /> {/* Response */}
            </div>
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-border p-4">
        <Skeleton className="h-[56px] w-full rounded-lg" /> {/* Chat input */}
        <div className="mt-2 flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" /> {/* Tool button */}
          <Skeleton className="h-8 w-8 rounded-full" /> {/* Settings button */}
          <Skeleton className="h-8 w-8 rounded-full" /> {/* MCP Servers button */}
        </div>
      </div>
    </div>
  );
}
