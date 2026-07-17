/**
 * @file frontend/src/routes/AppRoutes.tsx
 */

import { ResendVerificationPage } from "@/pages/auth/ResendVerificationPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { ProductDetailPage } from "@/pages/shop/ProductDetailPage";
import { VerifyEmailPage } from "@/pages/auth/VerifyEmailPage";
import { AdminLayout } from "@/components/layout/admin";
import { ComingSoonPage } from "@/pages/ComingSoonPage";
import { SignupPage } from "@/pages/auth/SignupPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { MainLayout } from "@/components/layout";
import { Routes, Route } from "react-router-dom";
import { ShopPage } from "@/pages/shop/ShopPage";
import { AdminRoute } from "./AdminRoute";
import {
  AdminProductsPage,
  AdminOrdersPage,
  AdminUsersPage,
} from "./lazyAdminPages";
import {
  CartPage,
  CheckoutPage,
  PayPalReturnPage,
  PayPalCancelPage,
  OrdersPage,
  ProfilePage,
} from "./lazyProtectedPages";

export function AppRoutes() {
  return (
    <Routes>
      {/* Auth pages: NO MainLayout — they use their own AuthLayout shell */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/resend-verification" element={<ResendVerificationPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Every route nested inside here renders through MainLayout's
          <Outlet />, getting the customer Header + Footer automatically. */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<ShopPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route
            path="/checkout/paypal/return"
            element={<PayPalReturnPage />}
          />
          <Route
            path="/checkout/paypal/cancel"
            element={<PayPalCancelPage />}
          />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* admin routes now sit as a TOP-LEVEL SIBLING, not nested
          inside <MainLayout>. Admin pages get ONLY AdminLayout's own
          topbar/sidebar (Part 9-A) — never the customer Header/Footer on
          top of it. */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route
            path="/admin"
            element={<ComingSoonPage title="Admin Panel" />}
          />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
