import Link from "next/link";
import { Waves } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 bg-primary-deep text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 text-sm sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <Waves className="h-4.5 w-4.5" strokeWidth={2} aria-hidden />
            </span>
            <span className="text-xl font-extrabold tracking-tight">
              allt<span className="text-amber-400">.ax</span>
            </span>
          </div>
          <p className="mt-3 max-w-xs leading-relaxed text-white/70">
            Ålands lokala sökmotor – hitta företag, tjänster, erbjudanden och
            evenemang i alla åländska kommuner.
          </p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">Utforska</h3>
          <ul className="mt-3 space-y-2 text-white/80">
            <li><Link href="/foretag" className="hover:text-white">Alla kategorier</Link></li>
            <li><Link href="/kommuner" className="hover:text-white">Kommuner</Link></li>
            <li><Link href="/erbjudanden" className="hover:text-white">Erbjudanden</Link></li>
            <li><Link href="/evenemang" className="hover:text-white">Evenemang</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">Om allt.ax</h3>
          <ul className="mt-3 space-y-2 text-white/80">
            <li><Link href="/for-foretag" className="hover:text-white">För företag</Link></li>
            <li><Link href="/om" className="hover:text-white">Om tjänsten</Link></li>
            <li><Link href="/integritet" className="hover:text-white">Integritet & cookies</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} allt.ax · Demoversion med fiktiv exempeldata
      </div>
    </footer>
  );
}
