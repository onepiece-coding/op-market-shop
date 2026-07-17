/**
 * @file frontend/src/components/ui/select/select.test.tsx
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { createRef } from "react";
import { Select } from ".";

import userEvent from "@testing-library/user-event";

const statusOptions = [
  { value: "PENDING", label: "Pending" },
  { value: "ACCEPTED", label: "Accepted" },
];

describe("Select", () => {
  it("renders a label correctly connected to its select", () => {
    render(<Select label="Status" options={statusOptions} />);
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
  });

  it("renders every option that was passed in", () => {
    render(<Select label="Status" options={statusOptions} />);
    expect(screen.getByRole("option", { name: "Pending" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Accepted" }),
    ).toBeInTheDocument();
  });

  it("shows a disabled placeholder option when 'placeholder' is given", () => {
    render(
      <Select
        label="Status"
        options={statusOptions}
        placeholder="Choose a status"
      />,
    );
    expect(
      screen.getByRole("option", { name: "Choose a status" }),
    ).toBeDisabled();
  });

  it("lets the user pick an option", async () => {
    const user = userEvent.setup();
    render(<Select label="Status" options={statusOptions} />);

    const select = screen.getByLabelText("Status") as HTMLSelectElement;
    await user.selectOptions(select, "ACCEPTED");

    expect(select.value).toBe("ACCEPTED");
  });

  it("shows an error message and marks the select invalid, when 'error' is given", () => {
    render(
      <Select
        label="Status"
        options={statusOptions}
        error="Please choose a status"
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please choose a status",
    );
    expect(screen.getByLabelText("Status")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("forwards a ref through to the real <select> DOM element", () => {
    const ref = createRef<HTMLSelectElement>();
    render(<Select label="Status" options={statusOptions} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
  });
});
