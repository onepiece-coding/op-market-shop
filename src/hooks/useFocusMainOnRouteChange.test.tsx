/**
 * @file frontend/src/hooks/useFocusMainOnRouteChange.test.ts
 */

import { useFocusMainOnRouteChange } from "./useFocusMainOnRouteChange";
import { MemoryRouter, Routes, Route, Link } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useRef } from "react";

import userEvent from "@testing-library/user-event";

function TestLayout({ children }: { children: React.ReactNode }) {
  const mainRef = useRef<HTMLElement>(null);
  useFocusMainOnRouteChange(mainRef);
  return (
    <div>
      <Link to="/page-two">Go to page two</Link>
      <main ref={mainRef} tabIndex={-1} data-testid="main">
        {children}
      </main>
    </div>
  );
}

describe("useFocusMainOnRouteChange", () => {
  it("does NOT focus <main> on the very first render", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <TestLayout>
          <p>Page one</p>
        </TestLayout>
      </MemoryRouter>,
    );

    expect(document.activeElement).not.toBe(screen.getByTestId("main"));
  });

  it("focuses <main> after a route change", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route
            path="/"
            element={
              <TestLayout>
                <p>Page one</p>
              </TestLayout>
            }
          />
          <Route
            path="/page-two"
            element={
              <TestLayout>
                <p>Page two</p>
              </TestLayout>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByText("Go to page two"));

    expect(await screen.findByText("Page two")).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByTestId("main"));
  });
});
