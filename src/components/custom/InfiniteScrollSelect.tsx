import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '@/modules/chat/hooks/useIntersectionObserver';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface InfiniteScrollSelectProps<T> {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  triggerClassName?: string;
  items: T[];
  itemId: keyof T;
  itemLabel: keyof T;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  isSearching?: boolean;
}

export function InfiniteScrollSelect<T>({
  value,
  onValueChange,
  disabled,
  placeholder = 'Select an item',
  triggerClassName,
  items,
  itemId,
  itemLabel,
  isLoading,
  hasMore,
  onLoadMore,
  onSearch,
  searchPlaceholder = 'Search...',
  isSearching = false,
}: InfiniteScrollSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const loadMoreThrottleRef = useRef<boolean>(false);
  const selectedItem = items.find((item) => String(item[itemId]) === value);
  const [inputValue, setInputValue] = useState('');

  // Handle search input changes with debounce
  const handleSearchChange = useCallback(
    (search: string) => {
      setInputValue(search);

      if (onSearch) {
        // Clear existing timeout
        if (searchTimeout.current) {
          clearTimeout(searchTimeout.current);
        }

        // Set new timeout for debouncing
        searchTimeout.current = setTimeout(() => {
          onSearch(search);
        }, 500);
      }
    },
    [onSearch]
  );

  // Setup intersection observer for infinite scrolling with throttling
  const handleLoadMore = useCallback(() => {
    if (loadMoreThrottleRef.current || isLoading) return;

    loadMoreThrottleRef.current = true;
    onLoadMore();

    // Reset throttle after a short delay
    setTimeout(() => {
      loadMoreThrottleRef.current = false;
    }, 300);
  }, [onLoadMore, isLoading]);

  const loadMoreRef = useIntersectionObserver(isLoading, hasMore, handleLoadMore);

  // Cleanup timeout on unmount
  // Cleanup timeouts on unmount and when component closes
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  // Reset input when dropdown closes
  useEffect(() => {
    if (!open) {
      setInputValue('');
    }
  }, [open]);

  // Determine if we should show the loader
  const showLoader = isSearching || isLoading;

  // Memoize the rendered items to prevent unnecessary re-renders
  const renderedItems = useMemo(() => {
    return items.map((item) => (
      <CommandItem
        key={String(item[itemId])}
        value={String(item[itemId])}
        onSelect={(currentValue) => {
          onValueChange(currentValue);
          setOpen(false);
          setInputValue('');
        }}
      >
        <Check className={cn('mr-2 h-4 w-4', value === String(item[itemId]) ? 'opacity-100' : 'opacity-0')} />
        <span className="truncate">{String(item[itemLabel])}</span>
      </CommandItem>
    ));
  }, [items, itemId, itemLabel, onValueChange, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-[300px] justify-between', triggerClassName)}
          disabled={disabled}
        >
          {selectedItem ? String(selectedItem[itemLabel]) : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] overflow-hidden p-0" align="start">
        <Command shouldFilter={false}>
          <div className="relative">
            <CommandInput
              placeholder={searchPlaceholder}
              value={inputValue}
              onValueChange={handleSearchChange}
              className={showLoader ? 'pr-8' : ''}
            />
            {showLoader && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <CommandList>
            <CommandEmpty className="py-2 text-center text-sm">
              {isSearching ? 'Searching...' : 'No items found'}
            </CommandEmpty>
            <CommandGroup>
              {renderedItems}
              {/* Hidden loader reference for infinite scroll detection */}
              {hasMore && <li ref={loadMoreRef} className="h-0 w-full" />}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
