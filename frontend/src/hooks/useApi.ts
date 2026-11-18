'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiRequest, formatApiError } from '@/lib/api';

interface Snapshot<T> {
  key: string | null;
  data: T | null;
  error: string | null;
}

export interface ApiResource<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

// Fetch a GET endpoint. Pass null to skip. Earlier data stays on screen while a new request
// (a page change, a filter, a reload) is in flight, so tables do not flash empty.
export function useApi<T>(path: string | null): ApiResource<T> {
  const [snapshot, setSnapshot] = useState<Snapshot<T>>({ key: null, data: null, error: null });
  const [version, setVersion] = useState(0);
  const key = path === null ? null : `${version}:${path}`;

  useEffect(() => {
    if (path === null) {
      return;
    }

    let cancelled = false;
    apiRequest<T>(path)
      .then((data) => {
        if (!cancelled) {
          setSnapshot({ key, data, error: null });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setSnapshot((previous) => ({ key, data: previous.data, error: formatApiError(error) }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [path, key]);

  const reload = useCallback(() => setVersion((value) => value + 1), []);
  const settled = snapshot.key === key;

  return {
    data: snapshot.data,
    error: settled ? snapshot.error : null,
    loading: key !== null && !settled,
    reload,
  };
}

// Run a write request and track its progress and error for the UI.
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T>(task: () => Promise<T>): Promise<T | undefined> => {
    setBusy(true);
    setError(null);
    try {
      return await task();
    } catch (caught) {
      setError(formatApiError(caught));
      return undefined;
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, error, setError, run };
}
