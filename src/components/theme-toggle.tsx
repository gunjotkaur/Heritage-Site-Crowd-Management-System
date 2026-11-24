
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Loading theme"
        disabled
        className="rounded-xl border border-border bg-card p-3"
      >
        <Sun size={19} />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="rounded-xl border border-border bg-card p-3 text-foreground transition hover:bg-accent hover:text-accent-foreground"
    >
      {isDark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}
