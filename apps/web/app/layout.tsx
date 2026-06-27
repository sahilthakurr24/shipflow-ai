import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";

import "./globals.css";
import { GlobalProviders } from "~/providers/global";
import { cn } from "~/lib/utils";

// Geist → headings, navigation, buttons, UI labels (the UI/display font).
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
// Inter → body text, descriptions, forms, documentation (the reading font).
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
// Geist Mono → code / monospace.
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "ShipFlow AI",
  description: "AI-assisted product delivery — feature request to shipped, reviewed code.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("dark", geist.variable, inter.variable, geistMono.variable)}
    >
      <body className="min-h-svh antialiased">
        <GlobalProviders>{children}</GlobalProviders>
      </body>
    </html>
  );
}
