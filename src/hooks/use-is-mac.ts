import { useSyncExternalStore } from 'react';

// The platform never changes during a session, so the store never emits.
const emptySubscribe = () => () => {};

/**
 * Detects macOS on the client without triggering a hydration mismatch.
 * Returns `false` on the server and the initial client render, then the
 * real value after hydration (via useSyncExternalStore's server snapshot).
 */
export function useIsMac() {
  return useSyncExternalStore(
    emptySubscribe,
    () => /macintosh/i.test(navigator.userAgent),
    () => false
  );
}
