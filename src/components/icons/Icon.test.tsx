/**
 * @file frontend/src/components/icons/Icon.test.tsx
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Icon } from "./Icon";

import styles from "./Icon.module.css";

describe("Icon", () => {
  it("renders an SVG with the correct viewBox", () => {
    const { container } = render(<Icon name="cart" label="Cart" />);
    const svg = container.querySelector("svg");

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
  });

  it("defaults to a 20px size when no size is given", () => {
    const { container } = render(<Icon name="cart" label="Cart" />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("width", "20");
    expect(svg).toHaveAttribute("height", "20");
  });

  it("uses a custom size when one is given", () => {
    const { container } = render(<Icon name="cart" size={32} label="Cart" />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("width", "32");
    expect(svg).toHaveAttribute("height", "32");
  });

  it("defaults to stroke='currentColor', so it inherits surrounding text color", () => {
    const { container } = render(<Icon name="cart" label="Cart" />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("stroke", "currentColor");
  });

  it("uses a custom color when one is given", () => {
    const { container } = render(
      <Icon name="trash" color="red" label="Delete" />,
    );
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("stroke", "red");
  });

  it("renders the correct path data for the requested icon name", () => {
    const { container: cartContainer } = render(
      <Icon name="cart" label="Cart" />,
    );
    const { container: trashContainer } = render(
      <Icon name="trash" label="Delete" />,
    );

    const cartPath = cartContainer.querySelector("path")?.getAttribute("d");
    const trashPath = trashContainer.querySelector("path")?.getAttribute("d");

    // different icon names should genuinely produce DIFFERENT path data —
    // proves the lookup from the dictionary is really working per-name
    expect(cartPath).not.toBe(trashPath);
    expect(cartPath).toBeTruthy();
    expect(trashPath).toBeTruthy();
  });

  // ---- THE ACCESSIBILITY DECISION — the most important tests in this file ----

  it("when a 'label' IS given: gets role='img' and an accessible name (meaningful icon)", () => {
    render(<Icon name="trash" label="Delete product" />);

    // getByRole with a "name" option only succeeds if role AND
    // aria-label are BOTH correctly set — a strong, real check
    const icon = screen.getByRole("img", { name: "Delete product" });
    expect(icon).toBeInTheDocument();
  });

  it("when NO 'label' is given: gets aria-hidden='true' and NO img role (decorative icon)", () => {
    const { container } = render(<Icon name="cart" />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("aria-hidden", "true");
    // a decorative icon should NOT be discoverable via role="img" at all
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("applies a custom className onto the svg element", () => {
    const { container } = render(
      <Icon name="cart" className="my-icon-class" label="Cart" />,
    );
    const svg = container.querySelector("svg");

    expect(svg).toHaveClass("my-icon-class");
  });

  it("always applies the base 'icon' class (flex-shrink protection), even with no custom className", () => {
    const { container } = render(<Icon name="cart" label="Cart" />);
    expect(container.querySelector("svg")).toHaveClass(styles.icon);
  });

  it("keeps the base 'icon' class even when a custom className is ALSO given", () => {
    const { container } = render(
      <Icon name="cart" className="custom" label="Cart" />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass(`${styles.icon} custom`);
  });
});
