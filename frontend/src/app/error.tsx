'use client';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold">Something went wrong</h1>
      <p className="mt-3 text-muted">{error.message || 'Please try that again.'}</p>
      <button
        type="button"
        className="mt-6 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
