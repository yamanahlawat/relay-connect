import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIsMac } from '@/hooks/use-is-mac';
import debounce from 'lodash/debounce';
import { Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ChatSearchProps {
  onSearch: (query: string) => void;
}

export function ChatSearch({ onSearch }: ChatSearchProps) {
  const [searchValue, setSearchValue] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearchRef = useRef<ReturnType<typeof debounce> | undefined>(undefined);

  const isMac = useIsMac();

  // Create a stable debounced search function
  useEffect(() => {
    debouncedSearchRef.current = debounce((query: string) => {
      onSearch(query.trim());
    }, 300);

    return () => {
      debouncedSearchRef.current?.cancel();
    };
  }, [onSearch]);

  const handleClearSearch = useCallback(() => {
    setSearchValue('');
    debouncedSearchRef.current?.cancel();
    onSearch('');
    searchInputRef.current?.focus();
  }, [onSearch]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSearchRef.current?.(value);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && isSearchFocused) {
        handleClearSearch();
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSearchFocused, handleClearSearch]);

  return (
    <div className="relative w-full">
      <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
      <Input
        ref={searchInputRef}
        value={searchValue}
        placeholder="Search"
        onChange={handleSearchChange}
        onFocus={() => setIsSearchFocused(true)}
        onBlur={() => setIsSearchFocused(false)}
        className="h-9 w-full pr-9 pl-9"
      />
      {searchValue && (
        <Button
          onClick={handleClearSearch}
          variant="ghost"
          size="icon"
          className="ring-offset-background absolute top-2 right-2 h-5 w-5 rounded-sm opacity-70 transition-opacity hover:opacity-100"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
      {!searchValue && (
        <kbd className="bg-muted pointer-events-none absolute top-2 right-2 hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none sm:flex">
          <span className="text-xs">{isMac ? '⌘' : 'Ctrl'}</span>K
        </kbd>
      )}
    </div>
  );
}
