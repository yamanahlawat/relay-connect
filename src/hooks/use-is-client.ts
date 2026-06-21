import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Returns `false` on the server and the initial client render, then `true`
 * after hydration. Use to gate client-only UI without a hydration mismatch
 * (the standard replacement for a `setMounted(true)` effect).
 */
export function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
