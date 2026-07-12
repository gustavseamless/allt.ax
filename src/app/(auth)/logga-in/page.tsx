import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Logga in",
  description: "Logga in på allt.ax för att hantera din företagsprofil.",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold">Logga in</h1>
      <p className="mt-2 text-sm text-muted">
        Hantera din företagsprofil, se statistik och skapa erbjudanden.
      </p>
      <LoginForm />
      <p className="mt-6 text-sm text-muted">
        Har du inget konto?{" "}
        <Link href="/registrera" className="font-medium text-primary hover:underline">
          Registrera dig gratis
        </Link>
      </p>
      <div className="mt-8 rounded-xl border border-dashed border-border bg-surface p-4 text-xs text-muted">
        <p className="font-semibold">Demokonton</p>
        <p>Admin: admin@allt.ax / admin123</p>
        <p>Företagare: foretag@example.ax / foretag123</p>
        <p>Användare: anna@example.ax / user123</p>
      </div>
    </div>
  );
}
