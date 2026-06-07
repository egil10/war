"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";

const OPTIONS = [
  { value: "light", icon: Sun },
  { value: "system", icon: Monitor },
  { value: "dark", icon: Moon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-8 w-[88px] rounded-full border border-border bg-surface" />;
  }

  return (
    <div className="inline-flex items-center rounded-full border border-border bg-surface p-0.5">
      {OPTIONS.map(({ value, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          aria-label={value}
          className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
            theme === value ? "bg-accent/15 text-accent" : "text-muted hover:text-fg"
          }`}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}
