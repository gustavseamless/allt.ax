import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { logoutAction } from "@/app/(auth)/actions";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/logga-in");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold">Min panel</h1>
          <p className="text-sm text-muted">Inloggad som {user.name} ({user.email})</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/panel" className="font-medium text-primary hover:underline">Översikt</Link>
          <Link href="/panel/konto" className="font-medium text-primary hover:underline">Konto</Link>
          <form action={logoutAction}>
            <button type="submit" className="rounded-lg border border-border px-3 py-1.5 hover:bg-surface">
              Logga ut
            </button>
          </form>
        </div>
      </div>
      <div className="py-6">{children}</div>
    </div>
  );
}
