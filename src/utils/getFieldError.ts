/**
 * @file frontend/src/utils/getFieldError.ts
 */

import { ApiError } from "@/api/ApiError";

// Looks through an ApiError's field-level validation details (Part 2-B's
// ValidationErrorDetail[]) and finds the message for ONE specific field.
// Example: getFieldError(someError, "email") might return "Invalid email".
// Returns undefined if: the error isn't really an ApiError, it has no
// field-level details at all, OR those details just don't mention this field.
export function getFieldError(
  error: unknown,
  fieldPath: string,
): string | undefined {
  // "instanceof" checks: is this REALLY our custom ApiError class (Part 3-A),
  // and not some other kind of error (a network failure, a typo bug, etc.)?
  if (!(error instanceof ApiError)) return undefined;
  if (!error.errors) return undefined;

  // .find() searches the array and returns the FIRST item where the
  // condition is true — or undefined if nothing matches
  const match = error.errors.find((detail) => detail.path === fieldPath);
  return match?.message;
}
