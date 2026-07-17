/**
 * @file frontend/src/hooks/useFocusMainOnRouteChange.ts
 */

import { useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";

/**
 * Moves keyboard focus to the page's <main> landmark every time the URL
 * changes. Fixes the real gap described above: React Router's client-side
 * navigation never resets focus on its own, so without this, a keyboard
 * or screen-reader user's focus silently stays on whatever link they
 * just clicked, even though the entire page around them changed.
 */
export function useFocusMainOnRouteChange(
  mainRef: React.RefObject<HTMLElement | null>,
) {
  const location = useLocation();
  // skips the VERY FIRST render — we don't want to yank focus away from
  // wherever the browser naturally placed it on initial page load (e.g.
  // the address bar, or nothing at all)
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    // tabIndex={-1} on <main> (set where this hook is used) makes it
    // programmatically focusable WITHOUT adding it to the normal Tab
    // order — a real user should never Tab onto <main> itself, only
    // land there automatically after a navigation
    mainRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);
}
