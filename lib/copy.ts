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
    sizes: "Sizes",
    soldOut: "Sold out",
    sizeSoldOut: "sold out",
    available: "Available",
    color: "Colour",
    orderingUnavailable:
      "Online ordering isn't available yet in this demo store.",
    placeholderImage: (name: string) => `Placeholder image for ${name}`,
    demoLabel: "Demo product",
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
