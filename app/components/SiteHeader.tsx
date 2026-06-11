"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/intelligence", label: "Intelligence" },
  { href: "/search", label: "Search" },
  { href: "/archive", label: "Archive" },
];

export default function SiteHeader() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-20 w-full border-b border-navy/10 bg-cream/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 sm:px-8 lg:px-10 py-3">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-navy transition-colors hover:text-vermillion"
        >
          Magincia Intelligence
        </Link>
        <ul className="flex items-center gap-5">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "text-vermillion"
                    : "text-navy/70 hover:text-vermillion"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
