/**
 * @file frontend/src/routes/lazyAdminPages.ts
 */

import { lazy } from "react";

export const CartPage = lazy(() =>
  import("@/pages/shop/CartPage").then((m) => ({
    default: m.CartPage,
  })),
);

export const CheckoutPage = lazy(() =>
  import("@/pages/shop/CheckoutPage").then((m) => ({
    default: m.CheckoutPage,
  })),
);

export const PayPalReturnPage = lazy(() =>
  import("@/pages/shop/PayPalReturnPage").then((m) => ({
    default: m.PayPalReturnPage,
  })),
);

export const PayPalCancelPage = lazy(() =>
  import("@/pages/shop/PayPalCancelPage").then((m) => ({
    default: m.PayPalCancelPage,
  })),
);

export const OrdersPage = lazy(() =>
  import("@/pages/shop/OrdersPage").then((m) => ({
    default: m.OrdersPage,
  })),
);

export const ProfilePage = lazy(() =>
  import("@/pages/shop/ProfilePage").then((m) => ({
    default: m.ProfilePage,
  })),
);
