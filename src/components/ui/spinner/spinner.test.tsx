/**
 * @file frontend/src/components/ui/spinner/spinner.test.tsx
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Spinner } from ".";

describe("Spinner", () => {
  it("renders with role='status', so assistive tech recognizes it as a live update", () => {
    render(<Spinner />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("announces the default 'Loading' label to screen readers", () => {
    render(<Spinner />);
    // this text is visually hidden (sr-only), but still findable by testing-library
    expect(screen.getByText("Loading")).toBeInTheDocument();
  });

  it("announces a custom label when one is provided", () => {
    render(<Spinner label="Saving your changes" />);
    expect(screen.getByText("Saving your changes")).toBeInTheDocument();
  });

  it("applies a custom className onto the wrapper element", () => {
    render(<Spinner className="my-custom-class" />);
    expect(screen.getByRole("status")).toHaveClass("my-custom-class");
  });
});
