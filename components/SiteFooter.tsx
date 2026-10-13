import { copy } from "@/lib/copy";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-stone-200 bg-stone-50">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-stone-600">
        <p className="font-medium text-stone-900">{copy.brand.name}</p>
        <p className="mt-1">{copy.footer.note}</p>
      </div>
    </footer>
  );
}
