import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Talkie — Najdi svůj hlas v angličtině",
  description:
    "Krátké dialogy, skutečné situace. Procvičuj angličtinu metodou shadowing.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
