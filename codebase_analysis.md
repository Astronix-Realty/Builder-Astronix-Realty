# 🏗️ Astronix Realty Builder Panel — Codebase Analysis

## 📌 Overview

**Astronix Realty Builder Panel** ek Next.js 14 based web application hai jo real estate builders ke liye property management wizard provide karta hai. Is app mein **Township → Project → Tower → Unit** ka hierarchical data structure hai.

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 14.1.0 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| UI Components | Radix UI + shadcn/ui |
| Forms | React Hook Form + Zod |
| Animations | Framer Motion |
| Charts | Recharts |
| PDF | jsPDF |
| Canvas/Drawing | Fabric.js |
| Database | Mongoose (MongoDB) |
| State | Browser LocalStorage |
| Icons | Lucide React |

---

## 📁 Folder Structure

```
builder-astronix-realty/
├── app/
│   ├── builder/           ← Property wizard (main builder tool)
│   │   ├── page.tsx       ← 939 lines — Main wizard controller (40KB)
│   │   └── loading.tsx
│   ├── builder-dashboard/ ← Dashboard view (100KB page!)
│   │   └── page.tsx
│   ├── seed/              ← Database seeding
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx           ← Redirects to builder
│
├── components/
│   ├── BannerEditor.tsx   ← Fabric.js canvas editor (57KB)
│   ├── theme-provider.tsx
│   │
│   ├── builder/
│   │   ├── forms/         ← Multi-step flow forms
│   │   │   ├── township-flow-form.tsx  (48KB)
│   │   │   ├── project-flow-form.tsx   (43KB)
│   │   │   ├── tower-flow-form.tsx     (49KB)
│   │   │   └── unit-flow-form.tsx      (155KB ← largest file!)
│   │   │
│   │   ├── crm/           → crm-view.tsx (31KB)
│   │   ├── inventory/     → inventory-view.tsx (44KB)
│   │   ├── documents/     → documents-view.tsx (27KB)
│   │   ├── blog/          → blog-view.tsx (43KB)
│   │   ├── chat/          → chat-view.tsx (10KB)
│   │   ├── team/          → team-view.tsx (12KB)
│   │   │
│   │   ├── projects-form.tsx    (8KB)
│   │   ├── towers-form.tsx      (8KB)
│   │   ├── units-form.tsx       (13KB)
│   │   ├── wizard-summary.tsx   (18KB)
│   │   └── progress-bar.tsx     (3KB)
│   │
│   └── ui/               ← 58 shadcn/ui components
│
├── lib/
│   ├── builder-types.ts  ← Core type definitions (41KB, 1148 lines)
│   ├── utils.ts          ← Utility functions
│   └── algorithms/vastu/ ← Vastu analysis algorithm
```

---

## 🗄️ Data Architecture

### Hierarchy (Parent → Child)

```
Township
  └── Project(s)
        └── Tower(s)
              └── Unit Configurations
                    └── Floor Groups
                          └── Unit Layout Slots
```

### Key Interfaces ([lib/builder-types.ts](file:///d:/Astronix%20Realty/New/builder-astronix-realty/lib/builder-types.ts))

| Interface | Purpose |
|---|---|
| [CommonInheritedData](file:///d:/Astronix%20Realty/New/builder-astronix-realty/lib/builder-types.ts#145-208) | Builder info, location, maps, amenities, legal |
| [TownshipData](file:///d:/Astronix%20Realty/New/builder-astronix-realty/lib/builder-types.ts#214-267) | Township-specific (hero, pricing, master plan, timeline) |
| [ProjectData](file:///d:/Astronix%20Realty/New/builder-astronix-realty/lib/builder-types.ts#273-332) | Project data (BHK configs, RERA, media) |
| [TowerData](file:///d:/Astronix%20Realty/New/builder-astronix-realty/lib/builder-types.ts#338-395) | Tower structure (floors, lifts, amenities) |
| [UnitConfiguration](file:///d:/Astronix%20Realty/New/builder-astronix-realty/lib/builder-types.ts#401-471) | Unit type, area, pricing, vastu, dimensions |
| [UnitTemplate](file:///d:/Astronix%20Realty/New/builder-astronix-realty/lib/builder-types.ts#514-579) | Tower-level pricing rules + all configurations |
| [FloorGroup](file:///d:/Astronix%20Realty/New/builder-astronix-realty/lib/builder-types.ts#487-508) | Floor range → unit layout mapping |
| [UnitLayoutSlot](file:///d:/Astronix%20Realty/New/builder-astronix-realty/lib/builder-types.ts#472-486) | Individual unit slot with status |
| [WizardState](file:///d:/Astronix%20Realty/New/builder-astronix-realty/lib/builder-types.ts#1106-1124) | Main app state containing everything |

---

## 🔄 Application Flow

### Builder Wizard (`/builder`)

3 flow types supported via `?flow=` query param:

```
?flow=township → Step 1 (Township) → 2 (Projects) → 3 (Towers) → 4 (Units) → Review
?flow=project  → Step 2 (Project)  → 3 (Towers)  → 4 (Units) → Review
?flow=tower    → Step 3 (Tower)    → 4 (Units)   → Review
```

**Step Components:**
- **Step 1** → `TownshipFlowForm` (township-flow-form.tsx)
- **Step 2** → `ProjectFlowForm` (project-flow-form.tsx)
- **Step 3** → `TowersForm` + `TowerFlowForm` (towers-form.tsx)
- **Step 4** → `UnitsForm` + `UnitFlowForm` (units-form.tsx)
- **Review** → `WizardSummary` (wizard-summary.tsx)

### Data Persistence

> [!NOTE]
> Abhi sirf **LocalStorage** use ho raha hai, koi backend API nahi hai.

```
localStorage.setItem("properties", ...)     ← Published properties
localStorage.setItem("propertyDrafts", ...) ← Draft saves
localStorage.getItem("theme", ...)          ← Theme preference
```

---

## 📊 Dashboard (`/builder-dashboard`)

Dashboard mein ye modules hain:
- **Properties** — Published + Draft properties list
- **Inventory** — Unit-wise inventory management ([inventory-view.tsx](file:///d:/Astronix%20Realty/New/builder-astronix-realty/components/builder/inventory/inventory-view.tsx))
- **CRM** — Customer relationship management ([crm-view.tsx](file:///d:/Astronix%20Realty/New/builder-astronix-realty/components/builder/crm/crm-view.tsx))
- **Documents** — Document management ([documents-view.tsx](file:///d:/Astronix%20Realty/New/builder-astronix-realty/components/builder/documents/documents-view.tsx))
- **Blog** — Blog post management ([blog-view.tsx](file:///d:/Astronix%20Realty/New/builder-astronix-realty/components/builder/blog/blog-view.tsx))
- **Team** — Team management ([team-view.tsx](file:///d:/Astronix%20Realty/New/builder-astronix-realty/components/builder/team/team-view.tsx))
- **Chat** — Chat interface ([chat-view.tsx](file:///d:/Astronix%20Realty/New/builder-astronix-realty/components/builder/chat/chat-view.tsx))

---

## 🧩 Key Components

### Forms (Multi-Step Wizard)

| File | Size | Purpose |
|---|---|---|
| [unit-flow-form.tsx](file:///d:/Astronix%20Realty/New/builder-astronix-realty/components/builder/forms/unit-flow-form.tsx) | **155KB** | Unit configs, pricing, vastu, floor plans |
| [tower-flow-form.tsx](file:///d:/Astronix%20Realty/New/builder-astronix-realty/components/builder/forms/tower-flow-form.tsx) | 49KB | Tower structure, amenities, floor breakdown |
| [township-flow-form.tsx](file:///d:/Astronix%20Realty/New/builder-astronix-realty/components/builder/forms/township-flow-form.tsx) | 48KB | Township identity, master plan, gallery |
| [project-flow-form.tsx](file:///d:/Astronix%20Realty/New/builder-astronix-realty/components/builder/forms/project-flow-form.tsx) | 43KB | Project details, BHK, legal |

### BannerEditor
[BannerEditor.tsx](file:///d:/Astronix%20Realty/New/builder-astronix-realty/components/BannerEditor.tsx) (57KB) — Fabric.js based canvas editor for creating property banners/marketing materials.

### UI Components (`/components/ui/`)
58 shadcn/ui components including: Sidebar, Chart, Calendar, Dialog, Sheet, Carousel, DataTable, etc.

---

## ⚙️ Auto-Calculations

Builder automatically calculates:
- `totalTowers` = projects se count
- `totalUnits` = towers × unitsPerFloor
- `priceRangeMin/Max` = unit configurations se
- `ratePerSqft` = basePrice / carpetArea
- **Floor Rise**: Floor 5+ pe 0.5% per floor price increase
- **Facing Premium**: Direction-wise price premium (North/South/East/West etc.)

---

## 🔑 Key Features

1. **Township Wizard** — 4-step multi-flow property creation
2. **Clone Feature** — Projects aur Towers ko duplicate kar sakte hain
3. **Unit Inventory** — Floor-wise unit slot management with status (available/sold/reserved/blocked)
4. **Vastu Analysis** — Room-wise vastu compliance tracking (`lib/algorithms/vastu/`)
5. **Banner Editor** — Fabric.js canvas-based marketing material creator
6. **Draft Save** — Work-in-progress save to localStorage
7. **Edit Mode** — Existing properties edit via `?edit=id` param
8. **Dark Mode** — System/light/dark theme support

---

## ⚠️ Current Limitations / Technical Debt

> [!WARNING]
> **No Backend/API**: Saara data sirf LocalStorage mein hai — koi MongoDB/API integration nahi hai abhi

> [!CAUTION]
> **Validation Disabled**: `validateStep()` function mein comment hai: *"⚠️ Validation temporarily disabled — enable before production"*

> [!NOTE]
> **Large Files**: `unit-flow-form.tsx` (155KB) bahut bada hai — refactoring ki zaroorat pad sakti hai

---

## 📈 File Size Summary

| File | Size |
|---|---|
| `builder-dashboard/page.tsx` | **100KB** |
| `unit-flow-form.tsx` | **155KB** |
| `BannerEditor.tsx` | 57KB |
| `builder-types.ts` | 41KB (1148 lines) |
| `builder/page.tsx` (wizard) | 40KB (939 lines) |
