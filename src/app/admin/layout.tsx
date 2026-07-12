import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Översikt" },
  { href: "/admin/foretag", label: "Företag" },
  { href: "/admin/ansprak", label: "Anspråk" },
  { href: "/admin/kampanjer", label: "Kampanjer" },
  { href: "/admin/kategorier", label: "Kategorier" },
  { href: "/admin/sokningar", label: "Sökningar" },
  { href: "/admin/import", label: "CSV-import" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    redirect("/logga-in");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold">Adminpanel</h1>
        <nav className="mt-3 flex flex-wrap gap-2 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border border-border px-3 py-1.5 font-medium hover:border-primary hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="py-6">{children}</div>
    </div>
  );
}
