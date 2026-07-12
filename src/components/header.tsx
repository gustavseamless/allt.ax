import Link from "next/link";
import { getSessionUser } from "@/lib/auth";

export async function Header() {
  const user = await getSessionUser();

  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-2xl font-bold tracking-tight text-primary">
          allt<span className="text-accent">.ax</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-foreground md:flex">
          <Link href="/foretag" className="hover:text-primary">Företag</Link>
          <Link href="/kommuner" className="hover:text-primary">Kommuner</Link>
          <Link href="/erbjudanden" className="hover:text-primary">Erbjudanden</Link>
          <Link href="/evenemang" className="hover:text-primary">Evenemang</Link>
          <Link href="/for-foretag" className="hover:text-primary">För företag</Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              {(user.role === "ADMIN" || user.role === "MODERATOR") && (
                <Link href="/admin" className="font-medium text-primary hover:underline">
                  Admin
                </Link>
              )}
              <Link href="/panel" className="font-medium text-primary hover:underline">
                Min panel
              </Link>
            </>
          ) : (
            <Link
              href="/logga-in"
              className="rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark"
            >
              Logga in
            </Link>
          )}
        </div>
      </div>
      <nav className="flex items-center gap-4 overflow-x-auto border-t border-border px-4 py-2 text-sm font-medium text-foreground md:hidden">
        <Link href="/foretag">Företag</Link>
        <Link href="/kommuner">Kommuner</Link>
        <Link href="/erbjudanden">Erbjudanden</Link>
        <Link href="/evenemang">Evenemang</Link>
        <Link href="/for-foretag">För företag</Link>
      </nav>
    </header>
  );
}
