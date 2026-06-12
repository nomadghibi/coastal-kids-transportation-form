import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Transportation Agreement / Field Trip Permission — Coastal Kids Academy",
  description:
    "Coastal Kids Academy Transportation Agreement and Field Trip Permission Form. Complete and download your permission form locally.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
