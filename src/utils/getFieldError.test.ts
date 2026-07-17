/**
 * @file frontend/src/utils/getFieldError.test.ts
 */

import { getFieldError } from "./getFieldError";
import { describe, it, expect } from "vitest";
import { ApiError } from "@/api/ApiError";

describe("getFieldError", () => {
  it("returns undefined when the error is not an ApiError at all", () => {
    expect(getFieldError(new Error("plain error"), "email")).toBeUndefined();
    expect(getFieldError("just a string", "email")).toBeUndefined();
    expect(getFieldError(null, "email")).toBeUndefined();
  });

  it("returns undefined when the ApiError has no field-level errors", () => {
    const error = new ApiError("Not found", 404);
    expect(getFieldError(error, "email")).toBeUndefined();
  });

  it("returns undefined when field errors exist but don't mention this field", () => {
    const error = new ApiError("Validation failed", 400, [
      { path: "password", message: "Too short" },
    ]);
    expect(getFieldError(error, "email")).toBeUndefined();
  });

  it("returns the matching message when the field IS present", () => {
    const error = new ApiError("Validation failed", 400, [
      { path: "email", message: "Invalid email" },
      { path: "password", message: "Too short" },
    ]);
    expect(getFieldError(error, "email")).toBe("Invalid email");
    expect(getFieldError(error, "password")).toBe("Too short");
  });
});
