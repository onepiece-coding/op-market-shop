/**
 * @file frontend/src/hooks/useFocusTrap.ts
 */

import { useEffect, useRef } from "react";

// The list of every element type we consider "focusable" for our trap.
// This is a well-known, standard selector list used across the industry
// for exactly this purpose — it covers the realistic cases (links,
// buttons, form fields, and anything explicitly given a tabindex).
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface UseFocusTrapOptions {
  isActive: boolean; // whether the trap should currently be enforced
  onEscape?: () => void; // called when the user presses Escape while trapped
}

/**
 * Extracted from Modal.tsx (Part 7-B) — the exact same three
 * accessibility jobs (trap Tab focus inside a container, lock body
 * scroll, restore focus to whatever had it before), now reusable by
 * ANYTHING that needs an off-canvas or overlay panel — starting with
 * this Part's mobile admin sidebar.
 */
export function useFocusTrap<T extends HTMLElement>({
  isActive,
  onEscape,
}: UseFocusTrapOptions) {
  const containerRef = useRef<T>(null);
  // Remembers which element had keyboard focus BEFORE the modal opened,
  // so we can hand focus back to it once the modal closes. Without this,
  // a keyboard user would lose their place in the page entirely.
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    previousActiveElementRef.current =
      document.activeElement as HTMLElement | null;

    const containerNode = containerRef.current;
    const focusable =
      containerNode?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    if (focusable && focusable.length > 0) {
      focusable[0].focus();
    } else {
      containerNode?.focus();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onEscape?.();
        return;
      }

      if (event.key === "Tab") {
        const nodes =
          containerNode?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (!nodes || nodes.length === 0) return;

        const first = nodes[0];
        const last = nodes[nodes.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActiveElementRef.current?.focus();
    };
  }, [isActive, onEscape]);

  return containerRef;
}
