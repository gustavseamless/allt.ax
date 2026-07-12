import { cn } from "@/lib/utils";

/** Mandatory, clearly visible label for all paid placements. */
export function SponsoredBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-accent-light px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-accent",
        className,
      )}
      title="Betald placering – tydligt märkt enligt våra annonsregler"
    >
      Sponsrad
    </span>
  );
}

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-primary-light px-2 py-0.5 text-xs font-medium text-primary",
        className,
      )}
      title="Företaget har verifierat sina uppgifter"
    >
      ✓ Verifierad
    </span>
  );
}

export function PremiumBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-surface px-2 py-0.5 text-xs font-medium text-muted",
        className,
      )}
      title="Premiumprofil med utökad information"
    >
      Premium
    </span>
  );
}

export function OpenBadge({ open, text, className }: { open: boolean; text: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        open ? "bg-success-light text-success" : "bg-surface text-muted",
        className,
      )}
    >
      {text}
    </span>
  );
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-dashed border-border px-2 py-0.5 text-xs text-muted",
        className,
      )}
      title="Fiktivt exempelföretag för demonstration"
    >
      Demo
    </span>
  );
}
