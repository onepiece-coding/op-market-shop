<div align="center">

# 🏴‍☠️ op-market

### A Full-Stack, Zero-Dependency E-Commerce Platform — Built with React, TypeScript, Express & PostgreSQL

**A modern online store engineered from first principles: a hand-rolled React frontend with zero UI/state libraries, paired with a secure, production-grade REST API.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tested with Vitest](https://img.shields.io/badge/Tested%20with-Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#-how-to-contribute)

[Live Demo](https://onepiece-coding.github.io/op-market-shop/) · [Report a Bug](#) · [Request a Feature](#)

</div>

---

## 📖 Table of Contents

- [Why op-market Exists](#-why-op-market-exists)
- [Core Features](#-core-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation Guide](#-installation-guide)
- [Environment Variables](#-environment-variables)
- [Usage Examples](#-usage-examples)
- [Running Tests](#-running-tests)
- [Roadmap](#-roadmap)
- [How to Contribute](#-how-to-contribute)
- [License](#-license)
- [Team](#-team)

---

## 💡 Why op-market Exists

Most e-commerce tutorials teach you how to *assemble* a store out of pre-built libraries — a UI kit here, a state manager there, a data-fetching library to glue it together. **op-market takes the opposite approach.**

The frontend ships with exactly **three** runtime dependencies: `react`, `react-dom`, and `react-router-dom`. Everything else — the caching layer, the toast notifications, the modal system, the form validation, even the SVG icons — is built from scratch. Not because good libraries don't exist, but because understanding *how* they work, at the level of `useSyncExternalStore`, focus traps, and cache invalidation strategies, makes you a fundamentally stronger engineer than importing a package and reading its docs.

The backend takes security and correctness just as seriously: rotating refresh tokens, rate limiting, Zod-validated input on every route, and a Prisma schema designed to prevent the exact class of bugs (stale cache, race conditions, silent data loss) that sink real production apps.

This is a real, shippable online store — and a deep-dive reference for how one actually gets built, end to end.

---

## ✨ Core Features

### 🛍️ Customer Experience
- Debounced product search with server-side pagination
- Full shopping cart with real-time quantity updates (race-condition safe)
- Guest browsing with seamless auth-gated checkout redirects
- **Dual payment flows**: Cash on Delivery *and* full PayPal Checkout integration (create → approve → capture/cancel)
- Persistent, editable shipping & billing addresses
- Order history with live status tracking and cancellation
- Fully responsive, mobile-first design with zero layout-shift image loading

### 🔐 Authentication & Security
- JWT access tokens + rotating, revocable refresh tokens (httpOnly cookies only — never exposed to JS)
- Email verification and secure password-reset flows via transactional email
- Automatic silent token refresh with request de-duplication (no duplicate refresh storms)
- Role-based route guards (`USER` / `ADMIN`) mirrored precisely on frontend and backend

### 🛠️ Admin Dashboard
- Full CRUD for products, including Cloudinary-backed image uploads
- Order management with status workflows (`PENDING → ACCEPTED → OUT_FOR_DELIVERY → DELIVERED`)
- User management with role promotion/demotion — with a built-in safeguard against locking yourself out of your own admin panel
- Responsive sidebar navigation with a mobile drawer

### ⚙️ Engineering Highlights
- **Custom Map-based cache system** with subscribe/notify — no re-render storms, no external state library
- **Three deliberate cache-invalidation strategies** (exact-key, prefix-wide, in-place merge) chosen per mutation, not applied blindly
- Route-level **code splitting** via `React.lazy` — the admin panel never ships to anonymous shoppers
- Full accessibility pass: focus traps, skip links, `aria-live` regions, keyboard-navigable everything
- SEO-conscious: per-page meta tags, canonical links, JSON-LD structured data, `robots.txt`/`sitemap.xml`
- **300+ automated tests** with Vitest + React Testing Library across hooks, components, and integration flows

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, React Router, CSS Modules |
| **Backend** | Node.js, Express, TypeScript, Zod |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | JWT (access + refresh), bcrypt |
| **Payments** | PayPal REST API (sandbox & live) |
| **Media** | Cloudinary |
| **Email** | Brevo (Sendinblue) transactional API |
| **Testing** | Vitest, React Testing Library, Supertest |

---

## 📁 Project Structure

```
op-market/
├── backend/            # Express + TypeScript REST API
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── schema/       # Zod validation schemas
│   │   ├── services/     # Cloudinary, PayPal, Email
│   │   └── prisma/
│   └── package.json
│
└── frontend/           # Vite + React SPA (zero UI dependencies)
    ├── src/
    │   ├── api/          # Typed endpoint functions
    │   ├── cache/         # Custom cache store, keys, invalidation
    │   ├── hooks/         # useFetch, useMutate, usePagedFetch...
    │   ├── components/
    │   ├── context/       # Auth, Toast providers
    │   ├── pages/
    │   └── routes/
    └── package.json
```

> **Using the standalone frontend repo?** Skip straight to the [frontend installation steps](#2-frontend-setup) and point `VITE_API_BASE_URL` at any running instance of the API.

---

## ✅ Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** `v18` or higher
- **npm** `v9` or higher
- **PostgreSQL** `v14` or higher (a local instance or a hosted one like Supabase/Neon/Railway)
- **Git**
- A free [PayPal Developer](https://developer.paypal.com/) sandbox account
- A free [Cloudinary](https://cloudinary.com/) account (for product image uploads)
- A free [Brevo](https://www.brevo.com/) account (for transactional emails)

---

## 🔧 Installation Guide

### 1. Clone the repository

```bash
git clone https://github.com/onepiece-coding/op-market-shop.git
cd op-market-shop
```

### 2. Backend Setup

```bash
cd backend
npm install

# create your local environment file
cp .env.example .env
# now fill in DATABASE_URL, JWT secrets, PayPal/Cloudinary/Brevo keys — see below

# generate the Prisma client and apply migrations
npx prisma generate
npx prisma migrate dev

# start the API in development mode
npm run dev
```

The API will be running at `http://localhost:8000`.

### 3. Frontend Setup

```bash
cd ../frontend
npm install

# create your local environment file
cp .env.example .env
# set VITE_API_BASE_URL to your running backend, e.g.:
# VITE_API_BASE_URL=http://localhost:8000/api/v1

npm run dev
```

The app will be running at `http://localhost:3000`.

### 4. (First-time only) Create your admin account

The **very first account** ever registered on a fresh database is automatically granted the `ADMIN` role — no manual database editing required. Sign up through the app, verify your email, and you're in.

---

## 🔐 Environment Variables

<details>
<summary><strong>Backend (<code>backend/.env</code>)</strong></summary>

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing access tokens (32+ chars) |
| `REFRESH_TOKEN_SECRET` | Secret for signing refresh tokens (32+ chars) |
| `CLIENT_DOMAIN` | The frontend's URL, e.g. `http://localhost:3000` |
| `BREVO_API_KEY` | Transactional email API key |
| `FROM_EMAIL` | The "from" address for outgoing emails |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Image upload credentials |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | PayPal REST API credentials |
| `PAYPAL_ENV` | `sandbox` or `live` |

</details>

<details>
<summary><strong>Frontend (<code>frontend/.env</code>)</strong></summary>

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | The backend API's base URL, including `/api/v1` |

</details>

---

## 💻 Usage Examples

**Authenticating and fetching your profile via the API:**

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email": "you@example.com", "password": "yourpassword"}'

curl http://localhost:8000/api/v1/auth/me -b cookies.txt
```

**Using the frontend's custom data-fetching hook inside any component:**

```typescript
import { useFetch } from "@/hooks/useFetch";
import { searchProducts } from "@/api/products";
import { cacheKeys } from "@/cache/cacheKeys";

function FeaturedProducts() {
  const { data, isLoading, error } = useFetch(
    cacheKeys.products.search({ limit: 8 }),
    () => searchProducts({ limit: 8 }),
  );

  if (isLoading) return <Spinner />;
  if (error) return <p>Something went wrong.</p>;

  return data.data.map((product) => (
    <ProductCard key={product.id} product={product} />
  ));
}
```

---

## 🧪 Running Tests

```bash
# backend
cd backend && npm run test

# frontend
cd frontend && npm run test
```

Both suites run with [Vitest](https://vitest.dev/) and include unit, integration, and component-level tests.

---

## 🗺️ Roadmap

- [ ] Server-side rendering / prerendering for full search-engine indexability
- [ ] Real chip-style tags input in the admin product form
- [ ] Product reviews & star ratings
- [ ] Wishlist / saved-for-later
- [ ] Real-time order status notifications (WebSockets)
- [ ] Admin analytics dashboard (revenue, top products, order trends)
- [ ] Multi-language storefront (i18n)

Have an idea? [Open a feature request](#) — we'd love to hear it.

---

## 🤝 How to Contribute

Contributions, issues, and feature requests are genuinely welcome!

1. **Fork** the repository
2. **Create your branch**: `git checkout -b feature/amazing-feature`
3. **Follow the existing conventions**: strict TypeScript, CSS Modules for styling, and — for the frontend — no new runtime dependencies beyond `react-router-dom`
4. **Write tests** for any new logic (`npm run test` must pass)
5. **Commit** your changes: `git commit -m "feat: add amazing feature"`
6. **Push** to your branch: `git push origin feature/amazing-feature`
7. **Open a Pull Request** and describe what you changed and why

Please open an issue first for any large or breaking change, so we can discuss the approach together.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---

## 👥 Team

Built with ❤️ by the **OnePiece Coding Team**

- **Frontend** — [Lahcen](https://www.linkedin.com/in/lahcen-alhiane-61217239a/) — React, TypeScript, custom architecture
- **Backend** — [Mohamed](https://www.linkedin.com/in/mohamed-bouderya-0270142a2/) — Express, PostgreSQL, Prisma, API design

<div align="center">

⭐ **If this project helped you learn something, consider giving it a star!** ⭐

</div>
