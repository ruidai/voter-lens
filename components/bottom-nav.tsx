"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Camera, MessageSquare, User } from "lucide-react";
import { clsx } from "clsx";

export default function BottomNav() {
  const pathname = usePathname();

  // Hide bottom navigation on login and signup pages
  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Scan",
      href: "/scan",
      icon: Camera,
    },
    {
      label: "Align",
      href: "/chat",
      icon: MessageSquare,
    },
    {
      label: "Profile",
      href: "/login",
      icon: User,
    },
  ];

  return (
    <nav className="absolute bottom-0 left-0 right-0 z-40 bg-[#E0E5EC] border-t border-white/10 shadow-[-5px_-5px_10px_rgba(255,255,255,0.4),5px_5px_10px_rgba(163,177,198,0.3)]">
      <div className="flex justify-around items-center h-20 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center focus:outline-none"
            >
              <div
                className={clsx(
                  "flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300",
                  isActive
                    ? "text-[#6C63FF] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.6)] scale-[0.96]"
                    : "text-[#6B7280] shadow-[5px_5px_10px_rgba(163,177,198,0.3),-5px_-5px_10px_rgba(255,255,255,0.4)] hover:text-[#3D4852] active:scale-[0.98]"
                )}
              >
                <Icon className="w-5.5 h-5.5" />
                <span className="text-[9px] font-bold mt-1 uppercase tracking-wider scale-90">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
