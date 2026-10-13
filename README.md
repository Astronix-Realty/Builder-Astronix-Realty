# Builder Panel — Astronix Realty

> Property management, inventory allocation, unit availability, real-time pricing synchronization, and lead tracking portal for builders and mandate partners.

---

## 🏗️ Architectural Overview

The Builder panel is built with **Next.js 16 (App Router with Webpack)** and follows a **Clean, Layered Architecture**:
- **Controllers / Route Handlers (`app/api/`)**: RESTful endpoints handling request parsing, authentication, validation, and standard JSON response formatting.
- **Service Layer (`services/`)**: Encapsulates core business workflows:
  - `property-service.ts`: Comprehensive property CRUD, image processing, floor plans, and amenities management.
  - `authService.ts`: Builder authentication, role checks, password reset, and session verification.
  - `hierarchy-sync.ts` & `pricing-sync.ts`: Auto-aggregation of tower and project inventory counts and dynamic pricing intervals based on underlying unit inventory.
- **Data Access & Models (`models/`)**: Strongly typed Mongoose models (`Property`, `Project`, `Tower`, `Unit`, `Lead`, `User`, `Offer`, `Notification`, etc.) unified under `models/index.ts`.
- **Core Library & Utilities (`lib/`)**:
  - `config.ts`: Centralized environment variable validation and S2S header utilities.
  - `apiResponse.ts`: Unified API response structures (`apiSuccess`, `apiError`, `handleApiError`).
  - `rbac.ts`: Role-based access control (Builder, Mandate, TeamLeader).
  - `db.ts` / `mongodb.ts`: Cached MongoDB connection manager.

```
Builder-Astronix-Realty/
├── app/                  # Next.js App Router (Dashboard, Projects, Inventory)
│   └── api/             # API routes (REST endpoints)
│       └── internal/    # Authenticated S2S endpoints queried by Admin & Visitor panels
├── components/          # Modular React UI components
├── services/            # Pure business logic layer
│   ├── authService.ts
│   ├── property-service.ts
│   └── index.ts
├── models/              # Unified Mongoose models barrel
├── lib/                 # Core infrastructure
│   ├── config.ts        # Centralized type-safe environment configuration
│   ├── apiResponse.ts   # Standard API responses and error handler
│   ├── rbac.ts          # Role-Based Access Control logic
│   └── db.ts            # MongoDB connection caching
└── types/               # TypeScript domain interfaces
```

---

## 🔒 Service-to-Service (S2S) Internal API

The Builder panel acts as the authoritative source of truth for properties and inventory. It exposes authenticated internal endpoints protected by `INTERNAL_API_SECRET`:
- `GET /api/internal/v2/properties`: Live properties list queried by Admin and Visitor panels.
- `GET /api/internal/v2/builders`: Live builder profiles and accounts queried by Admin panel.
- `GET /api/internal/v2/inventory/[propertyId]`: Live unit-level inventory queried across panels.
- `POST /api/internal/property-status`: Receives admin approval/rejection/delisting status updates.

---

## ⚙️ Environment Configuration

All environment variables are parsed and validated through [`lib/config.ts`](file:///d:/Astronix%20Realty/Builder-Astronix-Realty/lib/config.ts):

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `MONGODB_URI` | MongoDB connection URI for Builder database | `mongodb+srv://...` |
| `VISITOR_MONGODB_URI` | Read connection to Visitor DB | `mongodb+srv://...` |
| `ADMIN_MONGODB_URI` | Read connection to Admin DB | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for signing builder sessions | Strong random string |
| `INTERNAL_API_SECRET` | Shared secret for cross-panel S2S communication | Shared internal key |
| `ADMIN_PANEL_URL` | Base URL of Admin panel | `http://localhost:3000` |
| `VISITOR_PANEL_URL` | Base URL of Visitor panel | `http://localhost:3002` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps Platform API key | API key |
| `RESEND_API_KEY` | Resend API key for transactional emails | `re_...` |
| `CLOUDINARY_*` | Cloudinary storage credentials | `CLOUDINARY_CLOUD_NAME`, etc. |

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
# Starts on http://localhost:3001
```

### 3. Type Checking & Verification
```bash
npx tsc --noEmit
```
