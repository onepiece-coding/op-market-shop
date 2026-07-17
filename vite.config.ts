/**
 * @file frontend/vite.config.ts
 */

// NOTE: we now import "defineConfig" from "vitest/config" instead of "vite".
// This special version understands BOTH Vite's settings AND Vitest's settings,
// so our editor won't show an error on the new "test" section below.

import { defineConfig } from "vitest/config";

import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    // "jsdom" fakes a browser so our tests can use things like "document" and "window"
    environment: "jsdom",
    // lets us write "describe", "it", "expect" in test files WITHOUT importing
    // them manually every single time — less typing, same behavior
    globals: true,
    // this file runs ONCE before all our tests, to set up jest-dom's extra checks
    setupFiles: "./src/test/setup.ts",
  },
  base: "/op-market-shop/",
  server: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        // Splits react/react-dom/react-router-dom into their OWN chunk,
        // separate from our app code. These libraries change far less
        // often than our own code — most future deploys only touch app
        // logic, not React itself. Keeping them in a separate, stable
        // file means a RETURNING visitor's browser can reuse its
        // ALREADY-CACHED copy of this vendor chunk after we ship a new
        // version, instead of re-downloading React on every deploy.
        manualChunks: (id) => {
          // If the module's path includes any of these, put it in the "vendor" chunk
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/react-router-dom/")
          ) {
            return "vendor";
          }
        },
      },
    },
  },
});
