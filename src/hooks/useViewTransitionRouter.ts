'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useViewTransitionRouter() {
  const router = useRouter();

  const navigate = useCallback(
    (href: string) => {
      if (!document.startViewTransition) {
        // Fallback for browsers that don't support View Transitions
        router.push(href);
        return;
      }

      document.startViewTransition(() => {
        router.push(href);
      });
    },
    [router]
  );

  return { navigate };
}
