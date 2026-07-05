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
      href: "/profile",
      icon: User,
    },
  ];

  return (
    <nav className="absolute bottom-0 left-0 right-0 z-40 bg-[#F9F9F7] border-t-2 border-[#111111]">
      <div className="flex divide-x divide-[#111111] h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex-1 flex flex-col items-center justify-center text-center focus:outline-none transition-colors duration-150",
                isActive
                  ? "bg-[#111111] text-[#F9F9F7]"
                  : "bg-transparent text-[#111111] hover:bg-[#E5E5E0]/40"
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-[9px] font-bold mt-1 uppercase tracking-wider font-sans leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
