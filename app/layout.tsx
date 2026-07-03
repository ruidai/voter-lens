import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/bottom-nav";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "BeBallotReady - Intelligent Voter Assistant",
  description: "Verify your registration status, scan voter guides, and check candidates alignment.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex justify-center items-stretch">
          {/* Mobile frame emulator centered on desktop */}
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border-x border-slate-100 dark:border-slate-800 shadow-xl flex flex-col min-h-screen relative pb-16">
            {children}
            <BottomNav />
          </div>
        </div>
      </body>
    </html>
  );
}
