/**
 * @file frontend/src/utils/cx.ts
 */

// A tiny "class name joiner" — combines multiple class names into one
// string, safely skipping over any that are false, null, or undefined.
// This lets us write conditional classes as plain JS expressions, like:
// cx(styles.button, isPrimary && styles.primary)
// — if isPrimary is false, that whole expression evaluates to "false",
// and cx() filters it out automatically.
export function cx(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}
