import { useEffect } from 'react';

/**
 * Triggers the provided refetch function when the window regains focus,
 * the document becomes visible again, or when the browser history pops
 * (e.g., user presses back/forward).
 *
 * Usage: useAutoRefresh(() => refetch(), [deps...])
 */
export function useAutoRefresh(refetch: () => void, deps: any[] = []) {
  useEffect(() => {
    const onFocus = () => refetch();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refetch();
    };
    const onPopState = () => refetch();

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('popstate', onPopState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

