import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { deleteAccountAction } from "@/app/(auth)/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mitt konto", robots: { index: false } };

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/logga-in");

  return (
    <div className="max-w-xl space-y-8">
      <section>
        <h2 className="text-xl font-bold">Mitt konto</h2>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex gap-2"><dt className="w-24 text-muted">Namn</dt><dd>{user.name}</dd></div>
          <div className="flex gap-2"><dt className="w-24 text-muted">E-post</dt><dd>{user.email}</dd></div>
          <div className="flex gap-2"><dt className="w-24 text-muted">Roll</dt><dd>{user.role}</dd></div>
        </dl>
      </section>
      <section className="rounded-xl border border-red-200 bg-red-50 p-4">
        <h3 className="font-semibold text-red-800">Radera konto</h3>
        <p className="mt-1 text-sm text-red-700">
          Ditt konto och dina anspråk raderas permanent. Företagsprofiler du
          hanterat blir kvar men kopplas bort från dig (GDPR).
        </p>
        <form action={deleteAccountAction} className="mt-3">
          <button
            type="submit"
            className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            Radera mitt konto permanent
          </button>
        </form>
      </section>
    </div>
  );
}
