import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Skapa konto",
  description: "Skapa ett gratis konto på allt.ax.",
  robots: { index: false },
};

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold">Skapa konto</h1>
      <p className="mt-2 text-sm text-muted">
        Gratis konto för att göra anspråk på din företagsprofil eller skapa en ny.
      </p>
      <RegisterForm />
      <p className="mt-6 text-sm text-muted">
        Har du redan ett konto?{" "}
        <Link href="/logga-in" className="font-medium text-primary hover:underline">
          Logga in
        </Link>
      </p>
    </div>
  );
}
