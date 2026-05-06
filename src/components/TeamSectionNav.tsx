"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

import type { Locale } from "@/lib/i18n";
import { withLocalePath } from "@/lib/i18n";

const navItems = [
  { key: "call", label: "Call", href: "/team/call" },
  { key: "client", label: "Client", href: "/team/client" },
  { key: "script", label: "Script", href: "/team/script" },
  { key: "note", label: "Note", href: "/team/note" },
  { key: "price", label: "Price", href: "/team/price" },
] as const;

export function TeamSectionNav({ locale }: { locale: Locale }) {
  const activeSegment = useSelectedLayoutSegment() ?? "call";

  return (
    <nav className="teamSidebarNav">
      {navItems.map((item) => (
        <Link
          key={item.key}
          className="teamSidebarLink"
          href={withLocalePath(locale, item.href)}
          aria-current={
            item.key !== "price" && activeSegment === item.key ? "page" : undefined
          }
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
