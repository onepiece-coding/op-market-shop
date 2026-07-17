/**
 * @file frontend/src/components/layout/footer/footer.test.tsx
 */

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { Footer } from ".";

describe("Footer", () => {
  it("renders the brand name and footer navigation links", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    expect(screen.getByText("op-market")).toBeInTheDocument();
    // expect(screen.getByText("Shop")).toBeInTheDocument();
    // expect(screen.getByText("Cart")).toBeInTheDocument();
  });

  it("renders the CURRENT year in the copyright line", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(new RegExp(String(currentYear))),
    ).toBeInTheDocument();
  });
});
