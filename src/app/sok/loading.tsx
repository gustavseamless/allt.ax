export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8" role="status" aria-live="polite">
      <div className="h-11 w-full animate-pulse rounded-lg bg-surface" />
      <div className="mt-6 space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 w-full animate-pulse rounded-xl bg-surface" />
        ))}
      </div>
      <span className="sr-only">Söker …</span>
    </div>
  );
}
