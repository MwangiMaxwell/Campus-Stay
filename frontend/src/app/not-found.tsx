import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="mt-3 text-muted">That address is not part of CampusStay.</p>
      <Link href="/" className="mt-6 inline-block font-semibold text-brand">
        Back to the home page
      </Link>
    </div>
  );
}
