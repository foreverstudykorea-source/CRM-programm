import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { connection } from "next/server";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: { default: "Forever Study CRM", template: "%s · Forever Study" },
  description: "Forever Study akademiyasi uchun boshqaruv tizimi",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0b1026", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Every page is rendered per request: it reads the session, and the CSP nonce must be fresh.
  await connection();
  return (
    <html lang="uz" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
