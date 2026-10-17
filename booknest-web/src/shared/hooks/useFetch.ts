import { useCallback, useEffect, useState } from 'react';
import { errorMessage, isAbort } from '../../api/client';

export interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

interface CompletedFetch<T> {
  key: string;
  data: T | null;
  error: string | null;
}

export type Fetcher<T> = (signal: AbortSignal) => Promise<T>;

export function useFetch<T>(key: string, fetcher: Fetcher<T>, enabled = true): FetchState<T> {
  const [completed, setCompleted] = useState<CompletedFetch<T>>({ key: '', data: null, error: null });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(value => value + 1), []);
  const requestKey = `${key}:${attempt}`;

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();

    void fetcher(controller.signal)
      .then(data => {
        if (!controller.signal.aborted) setCompleted({ key: requestKey, data, error: null });
      })
      .catch(error => {
        if (!controller.signal.aborted && !isAbort(error)) {
          const online = typeof navigator === 'undefined' || navigator.onLine;
          setCompleted({ key: requestKey, data: null, error: errorMessage(error, online) });
        }
      });

    return () => controller.abort();
  }, [enabled, fetcher, requestKey]);

  const current = enabled && completed.key === requestKey;
  return {
    data: current ? completed.data : null,
    isLoading: enabled && !current,
    error: current ? completed.error : null,
    retry,
  };
}
