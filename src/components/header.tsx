import Link from "next/link";
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
    <header className="sticky top-0 z-40 border-b border-hairline bg-[color:var(--background)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="font-display text-[1.6rem] font-bold leading-none text-ink"
          aria-label="allt.ax – till startsidan"
        >
          allt<span className="text-brass">.</span>ax
        </Link>
        <nav className="hidden items-center gap-7 text-[15px] font-medium text-foreground md:flex">
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
                className="rounded-full bg-ink px-5 py-2.5 font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                Min panel
              </Link>
            </>
          ) : (
            <Link
              href="/logga-in"
              className="rounded-full bg-ink px-5 py-2.5 font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              Logga in
            </Link>
          )}
        </div>
      </div>
      <nav className="flex items-center gap-5 overflow-x-auto border-t border-hairline px-4 py-2.5 text-sm font-medium text-foreground md:hidden">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="whitespace-nowrap">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
