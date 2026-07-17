/**
 * @file frontend/src/types/common.ts
 */

// A "type alias" just gives an existing type a new, clearer NAME.
// This doesn't change how the value behaves at all — it's purely for readability.

// Every model in your Prisma schema uses an auto-incrementing integer ID.
// Instead of writing "number" everywhere, we write "ID" — so anyone reading
// the code immediately understands "this number identifies a specific row".
export type ID = number;

// 🚩 GOTCHA #1: Dates over the network are NOT JavaScript Date objects.
// When Express calls res.json(), it runs JSON.stringify() internally.
// JSON has no concept of "dates" at all — so every JS Date automatically
// gets converted into a plain ISO text string, like "2026-07-07T10:30:00.000Z".
// We name the alias "ISODateString" (not just "string") so future-you remembers
// this field is secretly a date, and must be passed through `new Date(...)`
// before you can call .getMonth(), .toLocaleDateString(), etc. on it.
export type ISODateString = string;

// 🚩 GOTCHA #2: Prisma's "Decimal" fields (like Product.price, Order.netAmount)
// ALSO turn into strings over JSON, not numbers! This is because JavaScript's
// regular "number" type can lose precision with money (e.g. 0.1 + 0.2 !== 0.3),
// so Prisma's Decimal library deliberately serializes as a precise string like "19.99".
// We must convert this to a number ourselves ONLY when we're about to do math or
// display it — never store it as a number in our types, or TypeScript will lie to us.
export type DecimalString = string;
