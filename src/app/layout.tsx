import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mirevox Evals",
  description:
    "Realtime evals, English governance, and hyperscaler ingest for the Mirevox control plane",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
