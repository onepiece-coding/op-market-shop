/**
 * @file frontend/src/components/icons/iconPaths.tsx
 */

// This is the ONE dictionary every icon in our whole app comes from.
// Each entry is just the "d" attribute of an SVG <path> — the raw
// coordinate instructions that draw the shape. All of these are drawn
// on a standard 24x24 grid (the most common icon grid size), hand-picked
// to be simple, single-path shapes so this file stays easy to read and edit.
export const iconPaths = {
  // a shopping cart, for the header/cart badge
  cart: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 4.6A1 1 0 0 0 5.6 19H17M17 13v6M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM19 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  // a magnifying glass, for search inputs
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.35-4.35",
  // a simple trash can, for delete buttons
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6",
  // a checkmark, for success states and confirmations
  check: "M5 12l5 5 9-9",
  // an "x", for closing things and error states
  close: "M6 6l12 12M18 6L6 18",
  // a chevron pointing down, for expandable sections and native-select overlays
  chevronDown: "M6 9l6 6 6-6",
  // a chevron pointing left, for "previous page" pagination controls
  chevronLeft: "M15 18l-6-6 6-6",
  // a chevron pointing right, for "next page" pagination controls
  chevronRight: "M9 18l6-6-6-6",
  // a pencil, for edit buttons in the admin panel
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z",
  // a user/profile silhouette
  user: "M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  // a filled circle with an "i", for informational messages
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01",
  // a triangle with an exclamation mark, for warnings/errors
  alertTriangle:
    "M12 9v4M12 17h.01M10.3 3.9L2.8 17a1.5 1.5 0 0 0 1.3 2.2h15.8a1.5 1.5 0 0 0 1.3-2.2L13.7 3.9a1.5 1.5 0 0 0-2.6 0z",
  // a package/box, for order-related pages
  package: "M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8",
  // a house, for a homepage link
  home: "M3 10l9-7 9 7M5 9v10h14V9",
  // a plus sign, for "add" buttons
  plus: "M12 5v14M5 12h14",
} as const;

// This automatically DERIVES the list of valid icon names directly from
// the object above — "keyof typeof iconPaths" means "the union of every
// key this object has" (e.g. "cart" | "search" | "trash" | ...). This is
// important: it means we NEVER have to remember to update a separate
// "IconName" type by hand whenever we add a new icon to the dictionary —
// TypeScript keeps them perfectly in sync automatically.
export type IconName = keyof typeof iconPaths;
