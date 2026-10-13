import Link from "next/link";
import { MessagePage } from "@/components/ui/MessagePage";
import { copy } from "@/lib/copy";
import { buttonPrimary } from "@/lib/styles";

// Shown when a product page calls notFound(), e.g. /products/does-not-exist.
export default function ProductNotFound() {
  return (
    <MessagePage title={copy.notFound.productTitle} text={copy.notFound.productText}>
      <Link href="/products" className={`${buttonPrimary} inline-block`}>
        {copy.notFound.browseProducts}
      </Link>
    </MessagePage>
  );
}
