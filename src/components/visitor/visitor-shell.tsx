
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  Ticket,
  QrCode,
  Heart,
  Settings,
  Menu,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/visitor" },
  { name: "Explore Places", icon: Compass, href: "/visitor/explore" },
  { name: "My Bookings", icon: Ticket, href: "/visitor/bookings" },
  { name: "My Tickets", icon: QrCode, href: "/visitor/tickets" },
  { name: "Saved Places", icon: Heart, href: "/visitor/saved" },
  { name: "Settings", icon: Settings, href: "/visitor/settings" },
];

export default function VisitorShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const surface = "bg-card";
  const text = "text-foreground";
  const muted = "text-muted-foreground";
  const border = "border-border";

  return (
    <div className={`min-h-screen ${surface} ${text} transition-colors duration-300`}>
      <div className="flex min-h-screen">

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`${
            isMobileMenuOpen
              ? "fixed inset-y-0 left-0 z-50 flex w-64"
              : "hidden"
          } shrink-0 flex-col border-r ${border} ${surface} px-6 py-8 lg:static lg:z-auto lg:flex lg:w-64`}
        >
          <div className="mb-12">
            <h1 className="text-2xl font-bold tracking-tight">
              Heritage<span className="text-amber-500">Flow</span>
            </h1>
            <p className={`mt-1 text-xs ${muted}`}>
              Discover India's heritage
            </p>
          </div>

          <p className={`mb-4 text-xs font-semibold uppercase tracking-widest ${muted}`}>
            Main Menu
          </p>

          <nav className="flex flex-col gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-amber-400 text-[#24152d] shadow-md shadow-amber-400/20"
                      : `${muted} hover:bg-amber-400/10 hover:text-amber-500`
                  }`}
                >
                  <Icon size={19} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto">
            <div className={`mb-5 rounded-2xl border ${border} ${surface} p-4`}>
              <Compass className="mb-3 text-amber-500" size={25} />
              <p className="text-sm font-semibold">Explore more places</p>
              <p className={`mt-1 text-xs ${muted}`}>
                Discover the stories behind India's heritage.
              </p>
            </div>

            <button
              type="button"
              className={`flex w-full items-center gap-3 px-4 py-3 text-sm ${muted} hover:text-amber-500`}
            >
              <LogOut size={19} />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Area */}
        <main className="min-w-0 flex-1 px-5 py-6 md:px-8 lg:px-10">

          {/* Shared Topbar */}
          <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="rounded-lg p-2 transition hover:bg-amber-400/10 lg:hidden"
                aria-label="Toggle sidebar"
              >
                <Menu size={23} />
              </button>

              <div>
                <p className={`text-sm ${muted}`}>Welcome back!</p>
                <h2 className="text-xl font-bold md:text-2xl">
                  Explore the beauty of India
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />

              <button
                type="button"
                aria-label="Notifications"
                className={`relative rounded-xl border ${border} ${surface} p-3`}
              >
                <span className="text-lg">♢</span>
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-500" />
              </button>

              <div className={`flex items-center gap-3 rounded-xl border ${border} ${surface} p-2`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 font-bold text-[#24152d]">
                  V
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold">Visitor</p>
                  <p className={`text-xs ${muted}`}>Explorer</p>
                </div>
              </div>
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
