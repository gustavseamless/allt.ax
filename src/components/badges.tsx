import { cn } from "@/lib/utils";

/** Mandatory, clearly visible label for all paid placements. */
export function SponsoredBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-accent-light px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-accent",
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
        "inline-flex items-center gap-1 rounded-full bg-primary-light px-2.5 py-0.5 text-[11px] font-semibold text-primary",
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
        "inline-flex items-center rounded-full border border-brass/30 bg-accent-light/50 px-2.5 py-0.5 text-[11px] font-semibold text-brass",
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
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        open ? "bg-success-light text-success" : "bg-surface text-muted",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("h-1.5 w-1.5 rounded-full", open ? "bg-success" : "bg-muted/50")}
      />
      {text}
    </span>
  );
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-dashed border-border px-2.5 py-0.5 text-[11px] text-muted",
        className,
      )}
      title="Fiktivt exempelföretag för demonstration"
    >
      Demo
    </span>
  );
}
