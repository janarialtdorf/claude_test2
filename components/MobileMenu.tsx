"use client";

// The only client component so far: it needs browser state (open/closed)
// and click/keyboard handlers. Everything else renders on the server.

import Link from "next/link";
import { useEffect, useState } from "react";
import { copy } from "@/lib/copy";

export interface NavLink {
  href: string;
  label: string;
}

export function MobileMenu({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  // Close the menu when the Escape key is pressed.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((value) => !value)}
        className="rounded-md p-2 text-stone-900 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-stone-900"
      >
        <span className="sr-only">{open ? copy.nav.closeMenu : copy.nav.openMenu}</span>
        {/* Simple "hamburger" / "X" icon drawn with SVG lines */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          )}
        </svg>
      </button>

      {open && (
        <nav
          id="mobile-menu"
          aria-label={copy.nav.mainLabel}
          className="absolute inset-x-0 top-full border-b border-stone-200 bg-white shadow-sm"
        >
          <ul className="mx-auto max-w-6xl px-4 py-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  // Close after choosing a link (Next.js keeps component state between pages).
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-2 py-3 text-stone-900 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-stone-900"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
