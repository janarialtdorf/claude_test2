import Link from "next/link";
import { MessagePage } from "@/components/ui/MessagePage";
import { copy } from "@/lib/copy";
import { buttonPrimary } from "@/lib/styles";

// Shown for any URL that doesn't match a page, e.g. /something-random.
export default function NotFound() {
  return (
    <MessagePage title={copy.notFound.pageTitle} text={copy.notFound.pageText}>
      <Link href="/products" className={`${buttonPrimary} inline-block`}>
        {copy.notFound.browseProducts}
      </Link>
    </MessagePage>
  );
}
