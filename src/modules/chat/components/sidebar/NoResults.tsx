import { MessageSquare, SearchX } from 'lucide-react';

interface NoResultsProps {
  searchQuery?: string;
}

export function NoResults({ searchQuery }: NoResultsProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {searchQuery ? (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
            <SearchX className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-sm font-medium text-muted-foreground">No chats found</h3>
          <p className="mt-2 text-sm text-muted-foreground/70">{`No results for "${searchQuery}"`}</p>
        </>
      ) : (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-sm font-medium text-muted-foreground">No chats yet</h3>
          <p className="mt-2 text-sm text-muted-foreground/70">Start a new conversation to get started</p>
        </>
      )}
    </div>
  );
}
