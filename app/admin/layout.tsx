import type { Metadata } from "next";
import { copy } from "@/lib/copy";

export const metadata: Metadata = {
  title: { default: copy.admin.title, template: `%s | ${copy.admin.title}` },
  robots: { index: false, follow: false },
};

// Admin pages depend on who's logged in, so they're rendered per request and
// can't be part of a pre-built static shell. `instant = false` tells Next.js
// that's intended for everything under /admin. (Each page checks the user's
// role itself — see lib/auth.ts.)
export const instant = false;

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
