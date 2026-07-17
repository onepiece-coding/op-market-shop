/**
 * @file frontend/src/pages/auth/AuthLayout.test.tsx
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AuthLayout } from "./AuthLayout";

describe("AuthLayout", () => {
  it("renders the title, subtitle, children, and footer when all are given", () => {
    render(
      <AuthLayout
        title="Welcome back"
        subtitle="Log in"
        footer={<span>Footer text</span>}
      >
        <div>Form goes here</div>
      </AuthLayout>,
    );

    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByText("Log in")).toBeInTheDocument();
    expect(screen.getByText("Form goes here")).toBeInTheDocument();
    expect(screen.getByText("Footer text")).toBeInTheDocument();
  });

  it("renders correctly even without an optional subtitle or footer", () => {
    render(
      <AuthLayout title="Just a title">
        <div>Content</div>
      </AuthLayout>,
    );

    expect(screen.getByText("Just a title")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });
});
