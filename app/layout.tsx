import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/bottom-nav";

export const metadata: Metadata = {
  title: "Voter Lens - Independent Election Guidance",
  description: "Objective analysis and alignment checks for local candidates.",
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
      <body className="h-full antialiased bg-[#F9F9F7] text-[#111111] selection:bg-[#CC0000] selection:text-white">
        <div className="min-h-screen bg-[#F9F9F7] flex justify-center items-stretch p-0 md:p-4">
          {/* Mobile frame emulator centered on desktop: double border ink columns */}
          <div className="w-full max-w-md bg-[#F9F9F7] border-x-4 border-double border-[#111111] flex flex-col min-h-screen relative pb-20 overflow-hidden">
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
