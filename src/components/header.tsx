import Link from "next/link";
import { Waves } from "lucide-react";
import { getSessionUser } from "@/lib/auth";

const NAV = [
  { href: "/foretag", label: "Företag" },
  { href: "/kommuner", label: "Kommuner" },
  { href: "/erbjudanden", label: "Erbjudanden" },
  { href: "/evenemang", label: "Evenemang" },
  { href: "/for-foretag", label: "För företag" },
];

export async function Header() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2" aria-label="allt.ax – till startsidan">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <Waves className="h-4.5 w-4.5" strokeWidth={2} aria-hidden />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-primary-dark">
            allt<span className="text-accent">.ax</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-[15px] font-medium text-foreground md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              {(user.role === "ADMIN" || user.role === "MODERATOR") && (
                <Link href="/admin" className="font-semibold text-primary hover:underline">
                  Admin
                </Link>
              )}
              <Link
                href="/panel"
                className="rounded-lg bg-primary px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
              >
                Min panel
              </Link>
            </>
          ) : (
            <Link
              href="/logga-in"
              className="rounded-lg bg-primary px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
            >
              Logga in
            </Link>
          )}
        </div>
      </div>
      <nav className="flex items-center gap-5 overflow-x-auto border-t border-border px-4 py-2 text-sm font-medium text-foreground md:hidden">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="whitespace-nowrap">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
