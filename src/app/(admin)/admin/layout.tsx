
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  MapPin,
  Activity,
  LogOut,
  Menu,
  X,
  Landmark,
} from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const navigation = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Crowd Monitoring", href: "/admin/crowd", icon: Activity },
  { name: "Heritage Sites", href: "/admin/sites", icon: Landmark },
  { name: "Staff Management", href: "/admin/staff", icon: Users },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {sidebarOpen && (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-border px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-purple-950">
            <Landmark size={23} />
          </div>
          <div>
            <h2 className="text-lg font-bold">HeritageFlow</h2>
            <p className="text-xs text-muted-foreground">Admin Portal</p>
          </div>
          <button
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Management
          </p>

          {navigation.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin" &&
                pathname.startsWith(item.href + "/"));

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-amber-400 text-purple-950"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon size={19} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut size={19} />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 className="font-semibold">Admin Dashboard</h1>
              <p className="hidden text-xs text-muted-foreground sm:block">
                HeritageFlow Management System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">
              Administrator
            </span>
            <ThemeToggle />
          </div>
        </header>

        <main className="p-5 sm:p-7">{children}</main>
      </div>
    </div>
  );
}
