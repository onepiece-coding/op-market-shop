/**
 * @file frontend/src/main.tsx
 */

// StrictMode helps catch mistakes early during development (React's own safety tool)
// import { StrictMode } from "react";

// createRoot is how React 18+ attaches your app onto the real HTML page
import { createRoot } from "react-dom/client";

// ORDER MATTERS! reset.css must load first (wipe browser defaults)...
import "@/styles/reset.css"; // Error: Cannot find module or type declarations for side-effect import of './styles/global.css'.
// ...then variables.css (define our design tokens)...
import "./styles/variables.css"; // Error: Cannot find module or type declarations for side-effect import of './styles/global.css'.
// ...then global.css (apply those tokens to base elements like body, h1, etc.)
import "./styles/global.css"; // Error: Cannot find module or type declarations for side-effect import of './styles/global.css'.

// our root App component
import App from "./App.tsx";

// find the <div id="root"> in index.html and render our whole app inside it
createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  <App />,
  // </StrictMode>,
);
