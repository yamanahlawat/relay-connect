import { useEffect } from 'react';

interface KeyboardShortcutOptions {
  searchInputRef: React.RefObject<HTMLInputElement>;
  isSearchFocused: boolean;
  onEscape: () => void;
}

export function useKeyboardShortcuts({ searchInputRef, isSearchFocused, onEscape }: KeyboardShortcutOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && isSearchFocused) {
        e.preventDefault();
        onEscape();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchFocused, onEscape, searchInputRef]);
}
