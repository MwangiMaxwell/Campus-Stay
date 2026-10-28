export function PlaceholderPage({ title, summary }: { title: string; summary: string }) {
  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-muted">{summary}</p>
    </section>
  );
}
