/**
 * @file frontend/src/App.tsx
 */

import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "./context/toast";
import { AppRoutes } from "@/routes/AppRoutes";
import { AuthProvider } from "@/context/auth";
import { CacheProvider } from "@/cache";

function App() {
  return (
    // BrowserRouter must wrap EVERYTHING that uses router hooks —
    // that includes AuthProvider's children (ProtectedRoute/AdminRoute
    // both call useLocation), and every page itself.
    <BrowserRouter>
      <CacheProvider>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </CacheProvider>
    </BrowserRouter>
  );
}

export default App;
