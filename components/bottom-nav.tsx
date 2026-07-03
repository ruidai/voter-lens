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
      label: "Chat",
      href: "/chat",
      icon: MessageSquare,
    },
    {
      label: "Profile",
      href: "/login", // Redirect to login as auth placeholder
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 shadow-lg">
      <div className="max-w-md mx-auto flex justify-around items-center h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-colors focus:outline-none"
            >
              <div
                className={clsx(
                  "flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200",
                  isActive
                    ? "text-voter-blue-500 bg-voter-blue-50 dark:bg-voter-blue-700/10 scale-105"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                <Icon className="w-6 h-6" />
                <span className="text-[10px] font-medium mt-1">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
