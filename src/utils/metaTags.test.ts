/**
 * @file frontend/src/utils/metaTags.test.ts
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  setMetaName,
  setMetaProperty,
  setCanonicalLink,
  setJsonLd,
  removeJsonLd,
} from "./metaTags";

describe("metaTags", () => {
  beforeEach(() => {
    // start every test with a clean <head> — otherwise tags created by
    // one test would leak into the next
    document.head.innerHTML = "";
  });

  it("setMetaName creates a new meta tag when none exists", () => {
    setMetaName("description", "Hello world");
    const tag = document.querySelector('meta[name="description"]');
    expect(tag).toHaveAttribute("content", "Hello world");
  });

  it("setMetaName updates an EXISTING tag instead of creating a duplicate", () => {
    setMetaName("description", "First");
    setMetaName("description", "Second");

    const tags = document.querySelectorAll('meta[name="description"]');
    expect(tags).toHaveLength(1);
    expect(tags[0]).toHaveAttribute("content", "Second");
  });

  it("setMetaProperty uses the 'property' attribute, not 'name' (Open Graph convention)", () => {
    setMetaProperty("og:title", "My Title");
    expect(document.querySelector('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "My Title",
    );
    expect(document.querySelector('meta[name="og:title"]')).toBeNull();
  });

  it("setCanonicalLink creates and later updates a single <link rel=canonical>", () => {
    setCanonicalLink("https://example.com/a");
    setCanonicalLink("https://example.com/b");

    const links = document.querySelectorAll('link[rel="canonical"]');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "https://example.com/b");
  });

  it("setJsonLd injects a script tag with the given id and JSON content", () => {
    setJsonLd("test-jsonld", { "@type": "Product", name: "Mouse" });

    const script = document.getElementById("test-jsonld");
    expect(script).toHaveAttribute("type", "application/ld+json");
    expect(JSON.parse(script!.textContent!)).toEqual({
      "@type": "Product",
      name: "Mouse",
    });
  });

  it("removeJsonLd removes the script tag by id", () => {
    setJsonLd("test-jsonld", { name: "Mouse" });
    removeJsonLd("test-jsonld");

    expect(document.getElementById("test-jsonld")).toBeNull();
  });

  it("removeJsonLd does nothing (and does not throw) when the id doesn't exist", () => {
    expect(() => removeJsonLd("never-existed")).not.toThrow();
  });
});
