import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CacheProvider } from "./CacheProvider";
import { CacheStore } from "./CacheStore";
import { useCacheStore } from "@/hooks";
import { useState } from "react";

// A tiny test-only component. Its whole job is to call useCacheStore()
// and hand the result back to our test via the "onRender" callback,
// so our test can inspect exactly what the hook returned, every time
// this component renders.
function StoreDisplay({ onRender }: { onRender: (store: CacheStore) => void }) {
  const store = useCacheStore();
  onRender(store); // report this render's store instance back to the test
  // a simple bit of local state, just so we have a button that can
  // trigger a RE-render of this component on demand
  const [count, setCount] = useState(0);
  return (
    <div>
      <span>{count}</span>
      <button onClick={() => setCount((c) => c + 1)}>Re-render</button>
    </div>
  );
}

describe("CacheContext", () => {
  it("gives components inside CacheProvider a real CacheStore instance", () => {
    // this array will collect every store instance handed back on every render
    const capturedStores: CacheStore[] = [];

    render(
      <CacheProvider>
        <StoreDisplay onRender={(store) => capturedStores.push(store)} />
      </CacheProvider>,
    );

    // the component rendered once, so we should have captured exactly one store
    expect(capturedStores).toHaveLength(1);
    // and it should truly be an instance of our real CacheStore class
    expect(capturedStores[0]).toBeInstanceOf(CacheStore);
  });

  it("keeps the SAME store instance across re-renders (never recreates it)", () => {
    const capturedStores: CacheStore[] = [];

    render(
      <CacheProvider>
        <StoreDisplay onRender={(store) => capturedStores.push(store)} />
      </CacheProvider>,
    );

    // simulate a user clicking the button, which triggers a re-render
    fireEvent.click(screen.getByText("Re-render"));

    // now we should have TWO captured stores (one per render)
    expect(capturedStores).toHaveLength(2);
    // "toBe" checks they are the EXACT SAME object in memory (reference
    // equality) — not just two objects that merely LOOK the same.
    // This proves our lazy useState initializer is working correctly.
    expect(capturedStores[0]).toBe(capturedStores[1]);
  });

  it("throws a clear error when used OUTSIDE of a CacheProvider", () => {
    // React logs its own scary red error to the console whenever a
    // component throws during render. We temporarily silence just that
    // console output so our test results stay clean and readable —
    // this does NOT hide whether our test itself passes or fails.
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    function BrokenComponent() {
      useCacheStore(); // no <CacheProvider> wraps this — this SHOULD throw
      return null;
    }

    // render() will throw while trying to run BrokenComponent — we wrap
    // it in an arrow function so .toThrow() can safely catch that throw
    // and check its error message matches what we expect
    expect(() => render(<BrokenComponent />)).toThrow(
      "useCacheStore must be used inside a <CacheProvider>",
    );

    // restore the real console.error so it works normally for any tests after this one
    consoleSpy.mockRestore();
  });
});
