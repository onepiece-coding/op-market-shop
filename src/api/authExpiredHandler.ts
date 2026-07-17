/**
 * @file frontend/api/authExpiredHandler.ts
 */

// This describes the SHAPE of the function we'll allow someone to register:
// a function that takes nothing and returns nothing.
type AuthExpiredHandler = () => void;

// This variable lives in memory for as long as the app is open.
// It starts as "null", meaning "nobody has registered a handler yet".
let currentHandler: AuthExpiredHandler | null = null;

// Later (in Part 6), our AuthContext will call this ONCE when the app starts,
// handing us a function like "() => { clearUser(); navigate('/login'); }".
// We don't need to know what that function does — we just store it.
export function setAuthExpiredHandler(handler: AuthExpiredHandler): void {
  currentHandler = handler;
}

// This is what apiRequest.ts calls when it discovers the user's session
// is truly dead (refresh failed). If nobody has registered a handler yet
// (e.g. very early in app startup), we simply do nothing instead of crashing.
export function triggerAuthExpired(): void {
  if (currentHandler) {
    currentHandler();
  }
}
