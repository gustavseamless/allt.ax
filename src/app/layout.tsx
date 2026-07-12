import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "allt.ax – Hitta allt på Åland",
    template: "%s | allt.ax",
  },
  description:
    "Ålands lokala sökmotor. Hitta företag, restauranger, tjänster, erbjudanden och evenemang i alla åländska kommuner.",
  openGraph: {
    siteName: "allt.ax",
    locale: "sv_FI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body className="antialiased flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
