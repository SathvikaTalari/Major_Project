import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClimateX — Smart Resource Conservation",
  description: "AI-Powered Earth Intelligence for Smart Resource Conservation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#0b0f19] text-slate-100">{children}</body>
    </html>
  );
}
