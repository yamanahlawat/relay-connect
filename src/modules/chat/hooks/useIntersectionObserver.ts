import { useCallback, useRef } from 'react';

export function useIntersectionObserver(
  isFetchingNextPage: boolean,
  hasNextPage: boolean | undefined,
  fetchNextPage: () => void
) {
  const observer = useRef<IntersectionObserver | null>(null);

  return useCallback(
    (node: HTMLLIElement | null) => {
      if (isFetchingNextPage) return;

      if (observer.current) {
        observer.current.disconnect();
      }

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });

      if (node) {
        observer.current.observe(node);
      }
    },
    [isFetchingNextPage, fetchNextPage, hasNextPage]
  );
}
