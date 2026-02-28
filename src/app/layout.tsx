import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

const marianne = localFont({
  src: [
    { path: "../../public/fonts/Marianne-Light.woff2", weight: "300", style: "normal" },
    { path: "../../public/fonts/Marianne-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/Marianne-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/Marianne-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-marianne",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Élections Municipales 2026 — Candidatures",
  description:
    "Recherchez les listes et candidats des élections municipales françaises 2026 (Tour 1).",
  openGraph: {
    title: "Élections Municipales 2026 — Candidatures",
    description: "Recherchez les listes et candidats des élections municipales françaises 2026.",
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning className={marianne.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Bouton dark/light mode en position fixe */}
          <div className="fixed top-4 right-4 z-50">
            <ThemeToggle />
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
