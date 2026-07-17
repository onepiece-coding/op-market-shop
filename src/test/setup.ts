/**
 * @file frontend/src/setup.ts
 */

// this one import adds extra matcher methods onto "expect", like:
// expect(element).toBeInTheDocument()
// expect(button).toBeDisabled()
// without this import, those methods wouldn't exist and tests using them would crash
import "@testing-library/jest-dom";
