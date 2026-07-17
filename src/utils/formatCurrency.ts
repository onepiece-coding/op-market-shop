/**
 * @file frontend/src/utils/formatCurrency.ts
 */

// Formats a plain number as a real, localized currency string, e.g.
// formatCurrency(49.99) -> "$49.99". We use the browser's OWN built-in
// Intl.NumberFormat tool for this — it correctly handles thousands
// separators, decimal rounding, and currency symbol placement, all
// without us writing any of that formatting logic by hand.
export function formatCurrency(
  amount: number,
  currency: string = "USD",
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}
