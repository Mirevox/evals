import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mirevox Evals",
  description:
    "Router-aware eval capture, English policy compile (dry-run), and fixture hyperscaler ingest for the Mirevox control plane",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
