import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 bg-primary-deep text-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 sm:grid-cols-3">
          <div>
            <div className="font-display text-3xl font-bold">
              allt<span className="text-amber-500/90">.</span>ax
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              Ålands lokala sökmotor – hitta företag, tjänster, erbjudanden och
              evenemang i alla åländska kommuner.
            </p>
          </div>
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">
              Utforska
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/75">
              <li><Link href="/foretag" className="transition-colors hover:text-white">Alla kategorier</Link></li>
              <li><Link href="/kommuner" className="transition-colors hover:text-white">Kommuner</Link></li>
              <li><Link href="/erbjudanden" className="transition-colors hover:text-white">Erbjudanden</Link></li>
              <li><Link href="/evenemang" className="transition-colors hover:text-white">Evenemang</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">
              Om allt.ax
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/75">
              <li><Link href="/for-foretag" className="transition-colors hover:text-white">För företag</Link></li>
              <li><Link href="/om" className="transition-colors hover:text-white">Om tjänsten</Link></li>
              <li><Link href="/integritet" className="transition-colors hover:text-white">Integritet & cookies</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-14 border-t border-white/10 pt-6 text-xs text-white/40">
          © {new Date().getFullYear()} allt.ax · Demoversion med fiktiv exempeldata
        </div>
      </div>
    </footer>
  );
}
