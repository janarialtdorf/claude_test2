import Link from "next/link";
import { MobileMenu, type NavLink } from "@/components/MobileMenu";
import { copy } from "@/lib/copy";
import { getCategories } from "@/lib/products";

export function SiteHeader() {
  const links: NavLink[] = [
    { href: "/products", label: copy.nav.shopAll },
    ...getCategories().map((category) => ({
      href: `/products?category=${category.slug}`,
      label: category.name,
    })),
  ];

  return (
    <header className="relative border-b border-stone-200 bg-white">
      {/* Always-visible notice so nobody mistakes the demo for a real shop */}
      <p className="bg-stone-900 px-4 py-2 text-center text-xs text-stone-100 sm:text-sm">
        {copy.demoNotice}
      </p>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-900"
        >
          {copy.brand.name}
        </Link>

        {/* Desktop navigation */}
        <nav aria-label={copy.nav.mainLabel} className="hidden md:block">
          <ul className="flex gap-6">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-stone-700 hover:text-stone-950 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-900"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <MobileMenu links={links} />
      </div>
    </header>
  );
}
