/**
 * @file frontend/src/components/layout/skip-link/skip-link.module.css
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SkipLink } from ".";

describe("SkipLink", () => {
  it("renders a link pointing to #main-content", () => {
    render(<SkipLink />);
    expect(screen.getByText("Skip to main content")).toHaveAttribute(
      "href",
      "#main-content",
    );
  });
});
