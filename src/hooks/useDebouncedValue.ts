/**
 * @file frontend/src/hooks/useDebouncedValue.ts
 */

import { useEffect, useState } from "react";

/**
 * Returns a "delayed echo" of whatever value you give it. Every time the
 * INPUT value changes, we wait "delayMs" before updating our OWN output —
 * and if the input changes AGAIN before that wait finishes, we cancel the
 * old wait and start a brand new one. The end result: rapid changes (like
 * fast typing) get coalesced into a single update, once things settle down.
 */
export function useDebouncedValue<T>(value: T, delayMs: number = 400): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // schedule an update to happen "delayMs" from now
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    // THIS is the entire debounce mechanism: if "value" changes again
    // before the timeout above fires, React runs this cleanup FIRST,
    // canceling the stale timer, before scheduling a fresh one for the
    // NEW value. Only the LAST value in a rapid burst ever survives.
    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debouncedValue;
}
