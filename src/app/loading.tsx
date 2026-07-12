export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 text-center" role="status" aria-live="polite">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary-light border-t-primary" />
      <p className="mt-3 text-sm text-muted">Laddar …</p>
    </div>
  );
}
