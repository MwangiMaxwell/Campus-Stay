export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

interface ErrorPayload {
  message?: string;
  details?: unknown;
}

interface ApiPayload<T> {
  success: boolean;
  data?: T;
  error?: ErrorPayload;
}

function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? '';
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  const payload = (await response.json().catch(() => null)) as ApiPayload<T> | null;
  if (!response.ok || !payload || payload.success === false || payload.data === undefined) {
    const message = payload?.error?.message || 'Something went wrong. Please try again.';
    throw new ApiError(response.status, message, payload?.error?.details);
  }

  return payload.data;
}

export function formatApiError(error: unknown): string {
  if (error instanceof ApiError) {
    const details = error.details as { fieldErrors?: Record<string, string[]> } | undefined;
    const first = details?.fieldErrors ? Object.values(details.fieldErrors).flat()[0] : undefined;
    return first ?? error.message;
  }
  return 'Something went wrong. Please try again.';
}
