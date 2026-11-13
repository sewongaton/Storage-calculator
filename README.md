# ServiceNow Storage Sizing Calculator

An interactive, AI-assisted capacity planning and storage sizing web application for presales architects, solution architects, platform owners, and capacity planners modeling multi-year ServiceNow instance storage consumption.

## Key Capabilities

- **7-Stage Guided Assessment Workflow**:
  1. **Engagement Context & Capacity Baseline**: Client metadata, 1–10 year planning horizon, assessment classification (`New Implementation`, `Module Expansion`, `Platform Migration`, `Instance Consolidation`), 1-click archetype presets, and a mandatory **Minimum Licensed Storage Entitlement Matrix** across 9 industry verticals.
  2. **Product & Module Workload Discovery**: Coverage for 15 ServiceNow product suites and 65+ modules across IT, Customer, Employee, Creator, and Industry workflow families, with module-level database table sizing drivers and bundle presets.
  3. **Technical Assumptions & Data Profiles**: Configurable physical record sizes (KB), `sys_audit`/journal overhead, transactional/audit/event retention windows, compound annual growth rate (CAGR), legacy migration baseline, and **JSON/CSV Attachment Storage Profile upload** with downloadable sample templates.
  4. **Environment Topology & Sub-PROD Cloning**: Configurable non-production instances (`DEV`, `TEST`, `STAGE`, `SANDBOX`, custom), data scale percentages, attachment clone exclusions, audit truncation toggles, and 1-click recommended ServiceNow standards.
  5. **Capacity Forecasting & Entitlement Analytics**: Multi-year growth vs. licensed entitlement & operational buffer chart, architecture tier/product composition breakdown, sizing confidence score (0–100), multi-variable sensitivity what-if matrix, and **Word (`.docx`) report export** with embedded high-resolution chart graphics.
  6. **Scenario Comparison Studio**: Save, restore, duplicate, delete, and compare baseline vs. alternative capacity scenarios side-by-side.
  7. **Traceable Evidence Pack & Exports**: Audit-ready summary, 10-year forecast ledger, full input provenance matrix, print/PDF layout, Markdown copy, CSV ledger download, DOCX report download, and full JSON archive export/import.
- **AI Guardrails & Recursive Self-Improvement (RSI)**:
  - Server-side `/api/ai/validate`, `/api/ai/proposals`, and `/api/ai/advisor` endpoints powered by `@google/genai` (`gemini-3.8-flash`) with automatic local heuristic fallback when offline, unconfigured, or rate-limited.
  - One-click optimization proposals with reversible state rollback.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, Motion
- **Backend**: Node.js, Express 4, `tsx`, `@google/genai`
- **Exports**: `docx` (client-side `.docx` generation with HTML5 Canvas chart rendering), CSV, JSON, Markdown

---

## Prerequisites

- **Node.js**: `v20.x` or newer (recommended `v22.x`)
- **npm**: `v10.x` or newer (or `bun` if preferred)
- **Gemini API Key** *(optional)*: Required only if you want live Gemini-backed validation, RSI proposals, and advisor chat. Without a key, all AI endpoints automatically operate via the built-in heuristic rules and optimization engines.

---

## Installation Guide

### 1. Clone or Extract the Repository

```bash
git clone <your-repository-url>
cd <project-directory>
```

### 2. Install Dependencies

Using `npm`:

```bash
npm install
```

*(Or using `bun`: `bun install`)*

### 3. Configure Environment Variables

Copy the example environment file to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and set your configuration values:

```env
# Optional: Required for live Gemini AI validation, proposals, and advisor responses.
# If omitted or rate-limited, the server automatically falls back to built-in heuristics.
GEMINI_API_KEY="your_gemini_api_key_here"

# Application URL (used for hosted deployments)
APP_URL="http://localhost:3000"

# Optional: Server port (defaults to 3000)
PORT=3000
```

> **Security Note**: Never commit `.env` or expose `GEMINI_API_KEY` in client-side `VITE_*` variables. All Gemini SDK calls execute exclusively on the Express backend (`server.ts`).

### 4. Run in Development Mode

Start the Express + Vite middleware development server on port `3000`:

```bash
npm run dev
```

Once running, open your browser to:

```text
http://localhost:3000
```

You can also verify backend health at:

```text
http://localhost:3000/api/health
```

---

## Production Build & Deployment

### 1. Type-Check & Build Frontend Assets

```bash
npm run lint
npm run build
```

This runs `tsc --noEmit` to validate TypeScript types and outputs the optimized static frontend bundle into `dist/`.

### 2. Start the Production Server

```bash
NODE_ENV=production npm start
```

When `NODE_ENV=production` is set, `server.ts` serves the compiled static assets from `dist/` alongside the `/api/*` backend endpoints on the configured `PORT` (default `3000`, or pass `--port <number>`).

---

## Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `tsx server.ts` | Starts Express + Vite dev middleware on port 3000 |
| `npm run build` | `vite build` | Compiles production frontend assets to `dist/` |
| `npm start` | `tsx server.ts` | Starts the Express server (serves `dist/` when `NODE_ENV=production`) |
| `npm run lint` | `tsc --noEmit` | Runs full TypeScript static type checking |
| `npm run preview` | `vite preview` | Previews the Vite build without backend API routes |
| `npm run clean` | `rm -rf dist server.js` | Removes build artifacts |

---

## Project Structure

```text
.
├── .env.example              # Environment variable template
├── index.html                # HTML entry point and metadata
├── metadata.json             # Application metadata
├── package.json              # Scripts and dependencies
├── server.ts                 # Express server, Vite middleware, and /api/ai/* endpoints
├── tsconfig.json             # TypeScript compiler configuration
├── vite.config.ts            # Vite bundler configuration
└── src/
    ├── App.tsx               # Root state management, 7-stage router, RSI & scenario handlers
    ├── index.css             # Tailwind CSS v4 styles and print rules
    ├── main.tsx              # React DOM entry point
    ├── types/
    │   └── calculator.ts     # Core domain interfaces and workload schemas
    ├── constants/
    │   └── benchmarks.ts     # Industry entitlement matrix, 15-product catalog, presets
    ├── utils/
    │   ├── calculationEngine.ts  # Multi-year sizing, confidence, sensitivity & provenance engine
    │   ├── docxExport.ts         # Word (.docx) generator with rendered canvas chart graphics
    │   └── exportUtils.ts        # CSV ledger, Markdown summary, and file download utilities
    └── components/
        ├── ai/               # AI Validation Banner & Sizing Advisor / RSI Drawer
        ├── charts/           # Interactive SVG forecast and composition charts
        ├── layout/           # Top Header and 7-stage Workflow Sidebar
        └── stages/           # Stage 1 through Stage 7 UI components
```

---

## API Endpoints

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Returns server status, whether `GEMINI_API_KEY` is configured, and rate-limit state |
| `/api/ai/validate` | `POST` | Validates sizing inputs and flags architectural risks (with heuristic fallback) |
| `/api/ai/proposals` | `POST` | Generates actionable RSI optimization proposals mapped to calculator state fields |
| `/api/ai/advisor` | `POST` | Conversational ServiceNow storage architect advisor grounded in current assessment metrics |

---

## Troubleshooting

- **Port 3000 already in use**: Set `PORT=3001` in `.env` or run `npx tsx server.ts --port 3001`.
- **AI responses fall back to heuristics**: Confirm `GEMINI_API_KEY` is set in `.env` and restart the server. If your Gemini API key exceeds quota or experiences network timeouts (`>6.5s`), the backend automatically switches to its built-in heuristic rules engine so the calculator remains responsive.
- **TypeScript or build errors**: Run `npm run lint` and `npm run build` to inspect compiler diagnostics.
