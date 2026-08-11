# Mbarara Integrated Concrete Products Factory Suite

Professional planning, simulation, ERP, public website, reporting, and backend source for the **Mbarara Integrated Concrete Products Factory** project in Mbarara, Uganda.

## Live public website

Customer-facing website, product catalogue, inquiry flow, QR code, founder section, logistics/free-delivery messaging, and MTN/Airtel Mobile Money information:

**https://mbarara-concrete-factory.pages.dev/**

## Business plans

- English business plan: **https://mbarara-business-plan-english.pages.dev/**
- German business plan: **https://mbarara-business-plan-german.pages.dev/**

## Project note

The launch model is designed around a strict **UGX 130,000,000 Phase 1 starter budget**. The Phase 1 plan prioritises essential blocks, standard pavers, kerbstones, starter inventory, basic quality control, utilities, marketing, and working capital. Ready-mix concrete, culverts, heavy precast, and additional machinery are treated as later expansion items once operating cash flow supports them.

All currency values are in **UGX only**.

## Included projects

- `apps/mbarara-concrete-factory-platform`  
  Main React + TypeScript + Tailwind platform. Includes the public website source, internal factory planning modules, financial simulator, inventory, production, quality control, ERP, market intelligence, PDF reporting, and FastAPI backend source.

- `apps/concrete-factory-financial-simulator`  
  Standalone financial simulator for product costing, revenue, profit, break-even, ROI, and UGX 20,000,000 monthly profit checks.

- `apps/concrete-factory-inventory-system`  
  Standalone inventory system for cement, stone dust, sand, aggregates, diesel, water, pallets, moulds, spare parts, supplier tracking, usage, valuation, and reorder levels.

- `apps/concrete-factory-qc-database`  
  Standalone quality control database for production batches, compressive strength, absorption, density, dimensions, defects, approvals, rejection rate, and printable certificates.

- `apps/concrete-factory-erp-system`  
  Standalone ERP module covering sales, inventory, production, quality control, customers, suppliers, expenses, and reports.

- `apps/smallbiz-automation-guide-landing`  
  Separate Gumroad/Netlify landing page for the SmallBiz Automation Guide business. Includes `profile.html` for Gumroad custom profile use, `index.html` for Netlify, and a promotion playbook for getting small-business automation clients.

- `database/001_initial_schema.sql`  
  PostgreSQL-ready schema for future ERP integration.

- `reports-and-media/`  
  Investor PDF reports, merged prompt coverage report, and deployment notes. Previous synthetic-narration videos have been removed.

- `apps/mbarara-concrete-factory-platform/public/funding-pack/`  
  Serious investor funding pack for website downloads and outreach: 10-slide pitch deck, pitch deck PDF, one-page summary, UGX 130M Phase 1 budget, founder story and narration script, data file, and complete ZIP bundle.

## Local setup

Main platform:

```bash
cd apps/mbarara-concrete-factory-platform
npm install
npm run dev
```

Production build:

```bash
cd apps/mbarara-concrete-factory-platform
npm install
npm run build
```

API backend:

```powershell
cd apps/mbarara-concrete-factory-platform/backend
Copy-Item .env.example .env
pip install -r requirements.txt
```

The backend is structured for PostgreSQL and future ERP integration. Local database passwords, `.env` files, Python virtual environments, database data, and downloaded PostgreSQL runtime files are deliberately excluded from GitHub.

## Public sharing

For customers, colleagues in Uganda, Germany, or anywhere else, share the permanent Cloudflare Pages link:

**https://mbarara-concrete-factory.pages.dev/**

GitHub is for project source code, reports, and technical handover. The Cloudflare Pages link is the simple public website link.

## Disclaimer

Market prices, competitor data, supplier details, machinery quotations, logistics costs, and regulatory assumptions must be re-verified before investment, construction, procurement, lending, or contractual decisions. Records labelled Estimated, Needs Verification, Quotation Required, or Assumption are not confirmed market facts.
