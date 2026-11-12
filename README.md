# Krishi Setu (कृषि सेतु) — Backend

> **Village-Level Agriculture Intelligence & Decision-Support Platform**  
> B.Tech CSE Minor Project | Academic Year 2026–2027  
> Pilot Scope: Selected locations across **Madhya Pradesh** and **Uttar Pradesh**, India.

---

## 1. Project Overview

Krishi Setu is an explainable agricultural decision-support platform designed to help small and marginal farmers make data-backed choices without fabricating predictions or claiming unsupported certainty.

The backend is built as a single integrated Node.js / Express / TypeScript REST API covering five functional engines:
1. **Smart Mandi Decision Engine** — Transparent net-realization comparison across mandis using verified modal prices and user-entered transport costs.
2. **Crop Opportunity Engine** — Rule-based suitability assessment against documented agronomic conditions (season, soil, pH, water).
3. **Climate Risk Engine** — Sourced weather forecast (up to 16 days) and historical reanalysis (Copernicus ERA5) via Open-Meteo, with data provenance and freshness tracking.
4. **Government Support Engine** — Curated, source-verified scheme registry with eligibility conditions, exclusion criteria, and official portal links.
5. **Village Agriculture Dashboard** — Aggregated overview uniting all four modules for a village, engineered with graceful degradation for missing sections.

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime** | Node.js (v20+ / v24+) | JavaScript server-side execution |
| **Language** | TypeScript (v5+) | Strict static type checking |
| **Framework** | Express.js (v5) | RESTful routing and middleware |
| **Database** | MongoDB & Mongoose (v8+) | Schema-backed document persistence |
| **Validation** | Zod (v3/v4) | Request query, body, and environment validation |
| **Security** | Helmet, CORS | HTTP headers & cross-origin protection |
| **Test Framework** | Vitest (v5) | Fast unit and integration test runner |
| **Test Database** | mongodb-memory-server | Isolated in-memory MongoDB for automated tests |
| **HTTP Client** | Axios (backend) / Fetch API (frontend) | Provider adapter and API integration client |
| **API Docs** | OpenAPI 3.0 / Swagger UI | Interactive API documentation at `/api/v1/docs` |
| **Frontend UI** | React 19 + Vite 8 + Tailwind CSS v4 | Responsive decision-support user interface |
| **Icons** | Remixicon | Lightweight iconography |

---

## 3. Directory Structure

```text
krishi-setu/
├── backend/
│   ├── src/                   # Express API, models, services, tests and seed data
│   ├── scripts/               # Backend utilities, including load tests
│   ├── dist/                  # Compiled backend output
│   ├── .env.example           # Backend environment template
│   ├── API_DOCUMENTATION.md   # API contract and endpoints
│   ├── DATABASE_SCHEMA.md     # Schema design, models and indexes
│   ├── DATA_SOURCES.md        # External data provider status
│   ├── package.json           # Backend dependencies and npm scripts
│   ├── tsconfig.json
│   └── vitest.config.ts
├── frontend/                  # React + Vite + Tailwind CSS application
├── .gitignore
└── README.md
```

---

## 4. Local Setup Guide (Windows / PowerShell)

### Prerequisites
- **Node.js** (v20 or higher recommended). Verify: `node -v`
- **npm** (v10 or higher). Verify: `npm -v`
- **MongoDB** (Local Community Server on `mongodb://localhost:27017` OR MongoDB Atlas free tier URI). Note: Automated tests use `mongodb-memory-server` and run without a local MongoDB installation.

### Step-by-Step Installation

1. **Clone or navigate to the project directory:**
   ```powershell
   Set-Location "c:\Users\admin\Desktop\krishi setu"
   ```

2. **Install backend dependencies:**
   ```powershell
   Set-Location backend
   npm install
   ```

3. **Configure environment variables:**
   From the `backend` directory, copy `.env.example` to `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```
   Open `.env` in your editor and configure your `MONGODB_URI` if different from the default (`mongodb://localhost:27017/krishi_setu`).

4. **Seed development fixtures (optional but recommended for manual testing):**
   Set `ALLOW_SEED=true` in your `.env`, then run:
   ```powershell
   npm run seed
   ```
   *Note: All seeded price entries are explicitly flagged as `SYNTHETIC_DEMO` data and are never represented as official government figures.*

5. **Start the development server:**
   ```powershell
   npm run dev
   ```
   The backend will start at:
   - Base URL: `http://localhost:3000/api/v1`
   - Health Check: `http://localhost:3000/api/v1/health`
   - Interactive Docs: `http://localhost:3000/api/v1/docs`
   - OpenAPI Spec: `http://localhost:3000/api/v1/openapi.json`

6. **Run the automated test suite:**
   ```powershell
   npm test
   ```
   To run tests with code coverage:
   ```powershell
   npm run test:coverage
   ```

7. **Compile backend for production:**
   ```powershell
   npm run build
   npm start
   ```

8. **Start the Frontend UI Development Server:**
   In a separate terminal window opened at the project root, run:
   ```powershell
   npm --prefix frontend run dev
   ```
   The interactive UI will open at:
   - Application URL: `http://localhost:5173`
   - Configured Backend API: `http://localhost:3000/api/v1` (via `VITE_API_BASE_URL`)

9. **Build Frontend for Production:**
   From the project root, run:
   ```powershell
   npm --prefix frontend run build
   ```

---

## 5. Summary of Implemented Endpoints

All endpoints are versioned under `/api/v1`:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | System health and MongoDB connection status |
| `GET` | `/api/v1/data-sources/status` | Current verification and operational status of all external providers |
| `GET` | `/api/v1/docs` | Interactive Swagger UI API documentation |
| `GET` | `/api/v1/openapi.json` | Full OpenAPI 3.0.3 specification in JSON |
| `GET` | `/api/v1/crops` | List active crops (filter by `season`, `category`) |
| `GET` | `/api/v1/crops/:id` | Get single crop details and documented conditions |
| `GET` | `/api/v1/mandis` | List mandis (filter by `state`, `district`) |
| `GET` | `/api/v1/mandis/:id` | Get single mandi details |
| `GET` | `/api/v1/prices` | Query mandi commodity prices with observation dates and provenance |
| `POST` | `/api/v1/mandi-comparison` | Transparent Net Realization calculation comparing candidate mandis |
| `POST` | `/api/v1/crop-assessments` | Explainable suitability assessment against farm conditions |
| `GET` | `/api/v1/weather` | Open-Meteo weather forecast (1–16 days) with provenance |
| `GET` | `/api/v1/weather/historical` | Copernicus ERA5 historical weather observations |
| `GET` | `/api/v1/schemes` | List government agricultural schemes (filter by `state`, `status`) |
| `GET` | `/api/v1/schemes/:id` | Get scheme details by MongoDB ObjectId or `schemeCode` (e.g. `PM-KISAN`) |
| `GET` | `/api/v1/villages` | List villages (filter by `state`, `district`) |
| `GET` | `/api/v1/villages/:id` | Get village profile |
| `GET` | `/api/v1/villages/:id/dashboard` | Village Agriculture Dashboard combining all 4 modules |

---

## 6. Core Principles & Safeguards

- **No Fabricated Predictions:** The platform does not claim to predict crop yields, market price fluctuations, or catastrophic weather events.
- **No Arbitrary Scoring:** The provisional weighted formulas (MOS, COS, CRI, VAII) are explicitly withheld pending academic guide review. All comparisons display unweighted, explainable arithmetic and parameter matching.
- **Transparent Mandi Math:**
  $$\text{Gross Sale Value} = \text{Modal Price} \times \text{Quantity}$$
  $$\text{Net Realization} = \text{Gross Sale Value} - \text{Transport Cost} - \text{Other Selling Costs}$$
  If modal price is missing, the system will **never** silently substitute minimum or maximum prices. If transport cost is unentered, the comparison is marked as incomplete rather than assuming zero cost.
- **Graceful Partial Failure:** If an external provider (such as weather) is unreachable, the Village Dashboard returns the available mandi, crop, and scheme sections with an explicit `"status": "UNAVAILABLE"` notice for the weather section.
