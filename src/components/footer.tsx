import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:grid-cols-3">
        <div>
          <div className="text-xl font-bold text-primary">
            allt<span className="text-accent">.ax</span>
          </div>
          <p className="mt-2 max-w-xs text-muted">
            Ålands lokala sökmotor – hitta företag, tjänster, erbjudanden och
            evenemang i alla åländska kommuner.
          </p>
        </div>
        <div>
          <h3 className="font-semibold">Utforska</h3>
          <ul className="mt-2 space-y-1 text-muted">
            <li><Link href="/foretag" className="hover:text-primary">Alla kategorier</Link></li>
            <li><Link href="/kommuner" className="hover:text-primary">Kommuner</Link></li>
            <li><Link href="/erbjudanden" className="hover:text-primary">Erbjudanden</Link></li>
            <li><Link href="/evenemang" className="hover:text-primary">Evenemang</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold">Om allt.ax</h3>
          <ul className="mt-2 space-y-1 text-muted">
            <li><Link href="/for-foretag" className="hover:text-primary">För företag</Link></li>
            <li><Link href="/om" className="hover:text-primary">Om tjänsten</Link></li>
            <li><Link href="/integritet" className="hover:text-primary">Integritet & cookies</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} allt.ax · Demoversion med fiktiv exempeldata
      </div>
    </footer>
  );
}
