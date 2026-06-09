"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Display, Moon, Sun } from "@gravity-ui/icons";
import { Dropdown, Label, buttonVariants } from "@heroui/react";
import type { Selection } from "@heroui/react";

const OPTIONS = [
  { id: "system", label: "System", Icon: Display },
  { id: "light", label: "Light", Icon: Sun },
  { id: "dark", label: "Dark", Icon: Moon },
] as const;

/**
 * Theme switcher (next-themes) as a HeroUI Dropdown with System / Light / Dark.
 * Single-selection mode + `Dropdown.ItemIndicator` highlights the active choice.
 * Falls back to "light" until hydrated so the trigger icon matches the server.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // Deferred to a microtask so we don't call setState synchronously in the
  // effect body (project lint) — the theme isn't known during SSR.
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) setMounted(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const current = mounted ? (theme ?? "system") : "light";
  const CurrentIcon = OPTIONS.find((o) => o.id === current)?.Icon ?? Sun;

  function onSelectionChange(keys: Selection) {
    if (keys === "all") return;
    const next = [...keys][0];
    if (next) setTheme(String(next));
  }

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label="Change theme"
        className={`${buttonVariants({
          variant: "ghost",
          size: "sm",
          isIconOnly: true,
        })} inline-flex items-center justify-center ${className}`}
      >
        <CurrentIcon className="size-5" />
      </Dropdown.Trigger>
      <Dropdown.Popover className="min-w-40">
        <Dropdown.Menu
          aria-label="Theme"
          selectionMode="single"
          selectedKeys={new Set([current])}
          onSelectionChange={onSelectionChange}
        >
          {OPTIONS.map(({ id, label, Icon }) => (
            <Dropdown.Item key={id} id={id} textValue={label}>
              <Icon className="size-4 text-muted" />
              <Label>{label}</Label>
              <Dropdown.ItemIndicator />
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
