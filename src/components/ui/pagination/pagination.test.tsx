/**
 * @file frontend/src/components/ui/pagination/pagination.test.tsx
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Pagination } from ".";

import userEvent from "@testing-library/user-event";

describe("Pagination", () => {
  it("shows the current page and total pages", () => {
    render(
      <Pagination
        page={2}
        totalPages={5}
        hasNextPage
        hasPrevPage
        onNext={() => {}}
        onPrev={() => {}}
      />,
    );

    expect(screen.getByText("Page 2 of 5")).toBeInTheDocument();
  });

  it("shows just the page number when totalPages is not known yet", () => {
    render(
      <Pagination
        page={1}
        totalPages={undefined}
        hasNextPage={false}
        hasPrevPage={false}
        onNext={() => {}}
        onPrev={() => {}}
      />,
    );

    expect(screen.getByText("Page 1")).toBeInTheDocument();
  });

  it("disables the Previous button when hasPrevPage is false", () => {
    render(
      <Pagination
        page={1}
        totalPages={3}
        hasNextPage
        hasPrevPage={false}
        onNext={() => {}}
        onPrev={() => {}}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Previous page" }),
    ).toBeDisabled();
  });

  it("disables the Next button when hasNextPage is false (last page)", () => {
    render(
      <Pagination
        page={3}
        totalPages={3}
        hasNextPage={false}
        hasPrevPage
        onNext={() => {}}
        onPrev={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("calls onNext and onPrev when their buttons are clicked", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    const onPrev = vi.fn();

    render(
      <Pagination
        page={2}
        totalPages={5}
        hasNextPage
        hasPrevPage
        onNext={onNext}
        onPrev={onPrev}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Next page" }));
    await user.click(screen.getByRole("button", { name: "Previous page" }));

    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it("disables BOTH buttons while isLoading is true", () => {
    render(
      <Pagination
        page={2}
        totalPages={5}
        hasNextPage
        hasPrevPage
        onNext={() => {}}
        onPrev={() => {}}
        isLoading
      />,
    );

    expect(
      screen.getByRole("button", { name: "Previous page" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });
});
