"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

import type { Locale } from "@/lib/i18n";
import { withLocalePath } from "@/lib/i18n";

const navItems = [
  { key: "client", label: "Client" },
  { key: "script", label: "Script" },
  { key: "note", label: "Note" },
] as const;

export function TeamSectionNav({ locale }: { locale: Locale }) {
  const activeSegment = useSelectedLayoutSegment() ?? "client";

  return (
    <nav className="teamSidebarNav">
      {navItems.map((item) => (
        <Link
          key={item.key}
          className="teamSidebarLink"
          href={withLocalePath(locale, `/team/${item.key}`)}
          aria-current={activeSegment === item.key ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
