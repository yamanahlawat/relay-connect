import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        ref={searchInputRef}
        value={searchValue}
        placeholder="Search"
        onChange={handleSearchChange}
        onFocus={() => setIsSearchFocused(true)}
        onBlur={() => setIsSearchFocused(false)}
        className="h-9 w-full pl-9 pr-9"
      />
      {searchValue && (
        <Button
          onClick={handleClearSearch}
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-5 w-5 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
      {!searchValue && (
        <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}</span>K
        </kbd>
      )}
    </div>
  );
}
