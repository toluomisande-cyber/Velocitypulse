# VelocityPulse — Executive Sales Velocity & Intelligence Platform

A high-performance executive business intelligence dashboard and real-time AI analytics engine built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM (Neon PostgreSQL)**, **NextAuth**, and **Recharts**.

---

## 🚀 Key Features

### 1. Executive KPI Summary Suite
- **Total Revenue (This Week vs Last Week)**: Real-time calculation with % change and positive/negative trend indicators.
- **Weekly Sales Count / Units**: Volume metrics and week-over-week (WoW) order throughput.
- **Average Order Value (AOV)**: Track basket size shifts and WoW pacing.
- **Projected End-of-Month Run Rate**: Automatic pacing calculation using elapsed days against monthly run rates.

### 2. AI Intelligence Engine (Powered by Groq LLM)
- **Executive AI Copilot**: Grounded conversational assistant with real-time access to ledger transactions.
- **Automated Pattern Insights**: Algorithmic heuristic analysis combined with LLM trend classification.
- **4-Week Predictive Forward Regression**: Linear regression model with dynamic confidence interval corridors.

### 3. Charts & Analytics
- **Weekly Sales Growth Area Chart**: Daily sales plotted over the current vs previous week (Monday through Sunday) to visually benchmark velocity. Features toggle between **Daily Sales** and **Cumulative Pace**.
- **Week-over-Week Breakdown Bar Chart**: Aggregated revenue for the last 10–12 weeks with hover stats (Revenue, Volume, AOV, WoW Velocity %).
- **Growth Velocity Gauge / Speedometer**: Visual semi-circle speedometer tracking velocity % (`((this_week - last_week) / last_week) * 100`) with speed tiers (*Hyper-Growth*, *High Velocity*, *Moderate Growth*, *Decelerating*, *Sharp Decline*), net revenue delta, and actionable insight summaries.

### 4. Data Ingestion & Sales Log
- **"New Sale" Quick Modal**: Add single transactions on the fly (Amount, Category, Customer/Account, Order Reference, Date/Time, and Notes).
- **Bulk CSV Upload Dropzone**: Drag-and-drop or select CSV files with client-side PapaParse validation, schema checks, error reporting, and preview table.
- **Downloadable CSV Template**: Provided in `public/sample_sales_template.csv` for immediate testing.
- **Paginated, Filterable Transactions Table**: Real-time search by customer, order reference, or category; date-range filters; multi-column sorting; and CSV export.

### 5. Database Schema & Prisma ORM
- **`User`**: User authentication, password hashing (`bcryptjs`), business naming.
- **`Sale`**: Individual transactions with amounts, categories, customer references, timestamps, and indexes on `(userId, soldAt)`.
- **`WeeklyMetric`**: Pre-aggregated weekly metric cache for historical query efficiency.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Lucide React Icons
- **Visualizations**: Recharts Area & Bar charts, Custom SVG Velocity Speedometer
- **ORM**: Prisma ORM
- **Database**: Serverless PostgreSQL (Neon)
- **Authentication**: NextAuth (Credentials provider with bcrypt password hashing)
- **AI / LLM**: Groq SDK (`openai/gpt-oss-120b`, `qwen/qwen3.8-27b`)
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
Configure `.env`:
```env
DATABASE_URL="your-postgresql-connection-string"
DATABASE_URL_UNPOOLED="your-unpooled-postgresql-connection-string"
NEXTAUTH_SECRET="your-jwt-secret-key"
NEXTAUTH_URL="http://localhost:3000"
GROQ_API_KEY="your-groq-api-key"
```

### 4. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Executive Credentials
- **Email**: `admin@velocitypulse.io` (or `executive@company.com`)
- **Password**: `password123`

---

## 📁 Repository Structure

```
├── prisma/
│   ├── schema.prisma            # PostgreSQL schema with User, Sale, WeeklyMetric models
│   └── seed.ts                  # Production data seed script
├── public/
│   └── sample_sales_template.csv# Sample CSV template for bulk upload testing
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   │   ├── chat/route.ts       # Executive AI Copilot conversational endpoint
│   │   │   │   ├── forecast/route.ts   # 4-week forward projection endpoint
│   │   │   │   └── insights/route.ts   # Automated pattern analysis endpoint
│   │   │   ├── auth/[...nextauth]/route.ts # NextAuth authentication handler
│   │   │   ├── metrics/route.ts            # Computed KPI, velocity, and chart endpoints
│   │   │   └── sales/
│   │   │       ├── route.ts                # Paginated/filtered sales GET & single sale POST
│   │   │       └── bulk/route.ts           # Bulk CSV upload ingestion endpoint
│   │   ├── login/
│   │   │   └── page.tsx                    # Executive login portal
│   │   ├── globals.css                     # Editorial design tokens & styling
│   │   ├── layout.tsx                      # Root layout with SessionProvider
│   │   └── page.tsx                        # Main executive dashboard
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── header.tsx                  # Top navigation & user profile
│   │   │   ├── sidebar.tsx                 # Executive Suite navigation
│   │   │   ├── kpi-cards.tsx               # 4 top KPI summary cards with WoW badges
│   │   │   ├── weekly-growth-chart.tsx     # Current vs previous week daily velocity chart
│   │   │   ├── wow-breakdown-chart.tsx     # Revenue breakdown bar chart
│   │   │   ├── velocity-gauge.tsx          # SVG growth velocity gauge & metric formula
│   │   │   ├── ai-insights-panel.tsx       # Live AI insights panel
│   │   │   ├── ai-forecast-panel.tsx       # 4-week forward projection panel
│   │   │   ├── ai-chat-drawer.tsx          # Executive AI Copilot drawer
│   │   │   ├── sales-data-table.tsx        # Filterable, sortable, paginated transaction log
│   │   │   ├── new-sale-modal.tsx          # Quick transaction entry modal
│   │   │   └── csv-upload-dropzone.tsx     # Bulk CSV ingestion dropzone with preview
│   │   ├── ui/                             # Buttons, Cards, Inputs, Badges
│   │   └── providers.tsx                   # Session context provider
│   └── lib/
│       ├── analytics.ts                    # Math calculations for WoW, AOV, run rates, & velocity
│       ├── auth.ts                         # NextAuth executive credentials configuration
│       ├── gemini.ts                       # Groq LLM integration client
│       ├── prisma.ts                       # Singleton PrismaClient instance
│       └── utils.ts                        # Currency, percentage, and date utilities
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```
