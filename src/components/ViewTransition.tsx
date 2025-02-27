'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useRef } from 'react';

interface ViewTransitionProps {
  children: ReactNode;
}

export function ViewTransition({ children }: ViewTransitionProps) {
  const router = useRouter();
  const hasNavigated = useRef(false);
  const lastTransitionTime = useRef(0);
  const MIN_TRANSITION_INTERVAL = 300; // ms minimum time between transitions

  useEffect(() => {
    // Skip the initial render
    if (!hasNavigated.current) {
      hasNavigated.current = true;
      return;
    }

    // Check if View Transitions API is supported
    if (document.startViewTransition) {
      // Prevent rapid multiple transitions which can cause visual glitches
      const now = Date.now();
      if (now - lastTransitionTime.current < MIN_TRANSITION_INTERVAL) {
        return; // Skip this transition as it's too close to the previous one
      }

      lastTransitionTime.current = now;

      // Start the view transition
      document.startViewTransition(() => {
        return new Promise((resolve) => {
          // Use requestAnimationFrame for smoother timing that aligns with the browser's render cycle
          requestAnimationFrame(() => {
            // Let React render the new page content
            // The small timeout helps ensure React has completed its rendering work
            // before the transition animation begins
            setTimeout(resolve, 10);
          });
        });
      });
    }
  }, [router]);

  return <>{children}</>;
}
