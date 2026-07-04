import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/bottom-nav";

export const metadata: Metadata = {
  title: "Voter Lens - AI Voter Alignment Assistant",
  description: "Find your political alignment with local candidates using AI and responsive questions.",
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
    <html lang="en" className="h-full scroll-smooth">
      <body className="h-full antialiased bg-[#E0E5EC] text-[#3D4852] selection:bg-[#6C63FF]/20">
        <div className="min-h-screen bg-[#E0E5EC] flex justify-center items-stretch p-0 md:p-6">
          {/* Mobile frame emulator carved (inset shadow) into desktop canvas */}
          <div className="w-full max-w-md bg-[#E0E5EC] md:rounded-[32px] md:shadow-[inset_8px_8px_16px_rgba(163,177,198,0.6),inset_-8px_-8px_16px_rgba(255,255,255,0.5)] flex flex-col min-h-screen relative pb-20 overflow-hidden">
            <div className="flex-1 flex flex-col overflow-y-auto w-full">
              {children}
            </div>
            <BottomNav />
          </div>
        </div>
      </body>
    </html>
  );
}
