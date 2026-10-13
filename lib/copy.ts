// All visible storefront text lives here, so the brand name can be changed
// in one place and the copy can be translated (e.g. to Estonian) later.

export const copy = {
  brand: {
    name: "Threadline",
    tagline: "Everyday clothing for every season.",
  },
  demoNotice:
    "Demo store: all products are sample data and no real orders can be placed.",
  nav: {
    home: "Home",
    shopAll: "Shop all",
    mainLabel: "Main",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  home: {
    heroTitle: "Clothing for everyday life",
    heroText:
      "Browse tops, bottoms and outerwear in a simple, easy-to-use shop. This is a demo storefront built as a learning project.",
    heroCta: "Shop all products",
    categoriesTitle: "Shop by category",
    featuredTitle: "Featured products",
  },
  listing: {
    title: "All products",
    categoryNavLabel: "Product categories",
    allCategories: "All",
    loading: "Loading products…",
    empty: "No products in this category yet.",
    unknownCategory: "We couldn't find that category.",
    showAll: "Show all products",
    resultCount: (count: number) =>
      count === 1 ? "1 product" : `${count} products`,
  },
  product: {
    backToProducts: "Back to all products",
    soldOut: "Sold out",
    available: "Available",
    color: "Colour",
    placeholderImage: (name: string) => `Placeholder image for ${name}`,
    demoLabel: "Demo product",
  },
  addToCart: {
    sizeLegend: "Size",
    sizeSoldOut: "sold out",
    button: "Add to cart",
    selectSizeError: "Please select a size.",
    added: (name: string, size: string) => `Added ${name} (size ${size}) to your cart.`,
    limitReached: (max: number) =>
      `You already have the maximum of ${max} of this item in your cart.`,
    viewCart: "View cart",
    productSoldOut: "This product is sold out in all sizes.",
    demoNote: "Demo store: adding to the cart doesn't reserve stock.",
  },
  cart: {
    title: "Your cart",
    linkLabel: "Cart",
    linkLabelWithCount: (count: number) =>
      count === 1 ? "Cart, 1 item" : `Cart, ${count} items`,
    loading: "Loading your cart…",
    empty: "Your cart is empty.",
    browseProducts: "Browse products",
    size: "Size",
    quantity: "Quantity",
    quantityFor: (name: string, size: string) => `Quantity for ${name}, size ${size}`,
    remove: "Remove",
    removeLabel: (name: string, size: string) => `Remove ${name}, size ${size}, from cart`,
    each: "each",
    summary: "Cart summary",
    subtotal: "Subtotal",
    unavailableNotice: (count: number) =>
      count === 1
        ? "1 item in your cart is no longer available and isn't shown."
        : `${count} items in your cart are no longer available and aren't shown.`,
    dismissNotice: "Remove unavailable items",
    notAnOrder:
      "This is a demo cart, not an order. Nothing is reserved, and shipping isn't included.",
    goToCheckout: "Go to checkout",
  },
  checkout: {
    title: "Checkout",
    demoBanner:
      "Demo store: no payment is taken and nothing will be shipped. Please use made-up details.",
    summaryTitle: "Order summary",
    shipping: "Shipping",
    shippingDemo: "Not charged (demo order)",
    estimatedTotal: "Estimated total",
    totalNote: "The final total is calculated by our server when you place the order.",
    detailsTitle: "Delivery details",
    fields: {
      customerName: "Full name",
      email: "Email",
      addressLine1: "Street address",
      addressLine2: "Apartment, suite, etc. (optional)",
      city: "City",
      postalCode: "Postal code",
      country: "Country",
    },
    postalCodeHint: "5 digits, e.g. 10111",
    submit: "Place demo order",
    submitting: "Placing order…",
    backToCart: "Back to cart",
    emptyCart: "Your cart is empty, so there's nothing to check out.",
    errors: {
      required: "This field is required.",
      tooLong: "This is too long.",
      email: "Enter a valid email address, e.g. name@example.com.",
      postalCode: "Enter a 5-digit Estonian postal code.",
      country: "Please choose a delivery country.",
      fixFields: "Please fix the highlighted fields.",
      cartInvalid: "Your cart couldn't be read. Please return to the cart and try again.",
      unavailable: "Some items in your cart are no longer available in the quantity you chose:",
      unavailableHint: "Please update your cart and try again.",
      generic: "Sorry, we couldn't place your order. Please try again.",
    },
    confirmation: {
      title: "Demo order placed",
      reference: "Demo order reference",
      notice:
        "This was a demo order: no payment was taken and nothing will be shipped. No email has been sent.",
      total: "Total",
      continueShopping: "Continue shopping",
    },
  },
  notFound: {
    productTitle: "Product not found",
    productText:
      "This product doesn't exist or is no longer available.",
    pageTitle: "Page not found",
    pageText: "We couldn't find the page you were looking for.",
    browseProducts: "Browse all products",
  },
  error: {
    title: "Something went wrong",
    text: "Sorry, this page couldn't be loaded. Please try again.",
    retry: "Try again",
  },
  footer: {
    note: "Threadline is a demo learning project. Prices and products are not real.",
  },
} as const;
