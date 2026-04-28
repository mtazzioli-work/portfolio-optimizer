"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Upload,
  BarChart3,
  History,
  Settings,
  TrendingUp,
} from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portfolio/upload", label: "Upload Portfolio", icon: Upload },
  { href: "/analysis", label: "Analysis", icon: BarChart3 },
  { href: "/history", label: "History", icon: History },
  { href: "/settings/investment-profile", label: "Investment Profile", icon: Settings },
];

export function NavSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r bg-card flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-2 px-6 py-5 border-b">
        <TrendingUp className="h-6 w-6 text-primary" />
        <span className="font-semibold text-lg tracking-tight">Portfolio Optimizer</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === href || (href !== "/" && pathname.startsWith(href))
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-6 py-4 border-t flex items-center gap-3">
        <UserButton />
        <span className="text-sm text-muted-foreground">Account</span>
      </div>
    </aside>
  );
}
