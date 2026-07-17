/**
 * @file frontend/src/components/ui/input/input.test.tsx
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { createRef } from "react";
import { Input } from ".";

import userEvent from "@testing-library/user-event";

describe("Input", () => {
  it("renders a label correctly connected to its input", () => {
    render(<Input label="Email" />);
    // getByLabelText only succeeds if the <label>'s htmlFor truly matches the input's id
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("lets the user type into the field", async () => {
    const user = userEvent.setup();
    render(<Input label="Email" />);

    const input = screen.getByLabelText("Email");
    await user.type(input, "lahcen@test.com");

    expect(input).toHaveValue("lahcen@test.com");
  });

  it("shows an error message and marks the field invalid, when 'error' is given", () => {
    render(<Input label="Email" error="Invalid email" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Invalid email");
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("shows helper text when there is no error", () => {
    render(
      <Input label="Password" helperText="Must be at least 6 characters" />,
    );
    expect(
      screen.getByText("Must be at least 6 characters"),
    ).toBeInTheDocument();
  });

  it("hides the helper text once an error appears (error takes priority)", () => {
    render(
      <Input
        label="Password"
        helperText="Must be at least 6 characters"
        error="Too short"
      />,
    );
    expect(
      screen.queryByText("Must be at least 6 characters"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Too short")).toBeInTheDocument();
  });

  it("uses a caller-provided id instead of generating a new one", () => {
    render(<Input label="Email" id="custom-email-id" />);
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "id",
      "custom-email-id",
    );
  });

  it("forwards a ref through to the real <input> DOM element", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input label="Email" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
