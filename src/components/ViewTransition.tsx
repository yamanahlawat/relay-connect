'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useRef } from 'react';

interface ViewTransitionProps {
  children: ReactNode;
}

export function ViewTransition({ children }: ViewTransitionProps) {
  const router = useRouter();
  const hasNavigated = useRef(false);

  useEffect(() => {
    // Skip the initial render
    if (!hasNavigated.current) {
      hasNavigated.current = true;
      return;
    }

    // Check if View Transitions API is supported
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        return new Promise((resolve) => {
          // Let React render the new page content
          setTimeout(resolve, 0);
        });
      });
    }
  }, [router]);

  return <>{children}</>;
}
