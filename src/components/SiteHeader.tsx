"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { site } from "@/content/site";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="siteHeader">
      <Link className="siteLogo" href="/">
        {site.name}
      </Link>

      <nav className="siteNav" aria-label="Primary">
        <Link
          className="siteNavLink"
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
        >
          Gallery
        </Link>
        <a className="siteNavLink" href={site.instagramUrl}>
          Instagram
        </a>
        <Link
          className="siteNavLink"
          href="/contact"
          aria-current={pathname === "/contact" ? "page" : undefined}
        >
          Contact
        </Link>
      </nav>
    </header>
  );
}

