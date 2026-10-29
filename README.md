# Weekly Sales Velocity & Revenue Growth Dashboard

A clean, modern, executive-grade full-stack business analytics dashboard built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Prisma ORM (PostgreSQL / Supabase)**, **NextAuth**, and **Recharts**.

---

## 🚀 Key Features

### 1. Top KPI Summary Cards
- **Total Revenue (This Week vs Last Week)**: Real-time calculation with % change and green up / red down trend badge.
- **Weekly Sales Count / Units**: Volume metrics and week-over-week (WoW) order throughput.
- **Average Order Value (AOV)**: Track basket size shifts and WoW pacing.
- **Projected End-of-Month Run Rate**: Automatic pacing calculation using elapsed days against month targets.

### 2. Charts & Analytics Section
- **Weekly Sales Growth Area Chart**: Daily sales plotted over the current vs previous week (Monday through Sunday) to visually benchmark velocity. Features toggle between **Daily Sales** and **Cumulative Pace**.
- **Week-over-Week Breakdown Bar Chart**: Aggregated revenue for the last 10–12 weeks with hover stats (Revenue, Volume, AOV, WoW Velocity %).
- **Growth Velocity Gauge / Speedometer**: Visual semi-circle speedometer tracking velocity % (`((this_week - last_week) / last_week) * 100`) with speed tiers (*Hyper-Growth*, *High Velocity*, *Moderate Growth*, *Decelerating*, *Sharp Decline*), net revenue delta, and actionable insight summaries.

### 3. Data Ingestion & Sales Log
- **"New Sale" Quick Modal**: Add single transactions on the fly (Amount, Category, Customer/Account, Order Reference, Date/Time, and Notes).
- **Bulk CSV Upload Dropzone**: Drag-and-drop or select CSV files with client-side PapaParse validation, schema checks, error reporting, and preview table.
- **Downloadable CSV Template**: Provided in `public/sample_sales_template.csv` for immediate testing.
- **Paginated, Filterable Transactions Table**: Real-time search by customer, order reference, or category; date-range filters; multi-column sorting; and CSV export.

### 4. Database Schema & Prisma ORM
- **`User`**: User authentication, password hashing (`bcryptjs`), business naming.
- **`Sale`**: Individual transactions with amounts, categories, customer references, timestamps, and indexes on `(userId, soldAt)`.
- **`WeeklyMetric`**: Pre-aggregated weekly metric cache for historical query efficiency.
- **Dual Mode**: Runs against live **PostgreSQL / Supabase / Neon** via Prisma ORM, and features an automatic in-memory fallback for immediate zero-config testing if PostgreSQL is not yet booted.

### 5. Realistic 90-Day Seed Generator
- Realistic fluctuating trends: Tuesday–Thursday mid-week velocity spikes, weekend volume drops, macro growth trajectories, and diversified enterprise tiers (*Enterprise Plan*, *SaaS Pro Annual*, *SaaS Pro Monthly*, *Consulting Retainer*, *Cloud Data Sync*).

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Lucide React Icons
- **Visualizations**: Recharts Area & Bar charts, Custom SVG Velocity Speedometer
- **ORM**: Prisma ORM
- **Database**: PostgreSQL (Supabase / Neon / Docker compatible)
- **Authentication**: NextAuth (Credentials provider with bcrypt password hashing)
- **CSV Ingestion**: PapaParse

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Prisma Client
```bash
npm run db:generate
```

### 3. Setup Environment Variables
Copy `.env.example` to `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sales_velocity_db?schema=public"
NEXTAUTH_SECRET="sales-velocity-dashboard-secret-jwt-key-2026-production"
NEXTAUTH_URL="http://localhost:3000"
ENABLE_DEMO_FALLBACK="true"
```

### 4. (Optional) Run Database Migrations & Seed
When connected to your PostgreSQL / Supabase database:
```bash
# Push schema to PostgreSQL
npm run db:push

# Seed 90 days of realistic sales data
npm run db:seed
```

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Login Credentials
- **Email**: `demo@acme.com`
- **Password**: `password123`
*(Or click the **1-Click Sign In as Demo Admin** button on `/login`)*

---

## 📁 Repository Structure

```
├── prisma/
│   ├── schema.prisma            # PostgreSQL schema with User, Sale, WeeklyMetric models
│   └── seed.ts                  # 90-day realistic sales data seed script
├── public/
│   └── sample_sales_template.csv# Sample CSV template for bulk upload testing
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts # NextAuth authentication handler
│   │   │   ├── metrics/route.ts            # Computed KPI, velocity, and chart endpoints
│   │   │   └── sales/
│   │   │       ├── route.ts                # Paginated/filtered sales GET & single sale POST
│   │   │       └── bulk/route.ts           # Bulk CSV upload ingestion endpoint
│   │   ├── login/
│   │   │   └── page.tsx                    # Dark mode login page with 1-click demo login
│   │   ├── globals.css                     # Dark mode styling & crisp scrollbars
│   │   ├── layout.tsx                      # Root layout with SessionProvider
│   │   └── page.tsx                        # Main executive dashboard page
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── header.tsx                  # Top navigation with live actions & user profile
│   │   │   ├── sidebar.tsx                 # Collapsible dark sidebar & mobile drawer
│   │   │   ├── kpi-cards.tsx               # 4 top KPI summary cards with WoW badges
│   │   │   ├── weekly-growth-chart.tsx     # Current vs previous week daily velocity area chart
│   │   │   ├── wow-breakdown-chart.tsx     # 10-week revenue breakdown bar chart
│   │   │   ├── velocity-gauge.tsx          # SVG growth velocity gauge & metric formula
│   │   │   ├── sales-data-table.tsx        # Filterable, sortable, paginated transaction log
│   │   │   ├── new-sale-modal.tsx          # Quick transaction entry modal
│   │   │   └── csv-upload-dropzone.tsx     # Bulk CSV ingestion dropzone with preview
│   │   ├── ui/                             # Buttons, Cards, Inputs, Badges
│   │   └── providers.tsx                   # Session context provider
│   └── lib/
│       ├── analytics.ts                    # Math calculations for WoW, AOV, run rates, & velocity
│       ├── auth.ts                         # NextAuth credentials provider configuration
│       ├── mock-data.ts                    # 90-day fluctuating data generator
│       ├── prisma.ts                       # Singleton PrismaClient instance
│       └── utils.ts                        # Currency, percentage, and date utilities
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

