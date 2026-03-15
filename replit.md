# EcoMonitor SMPT

## Overview

**EcoMonitor SMPT** (Sistema de Monitoramento e Proteção Térmica Sistêmica) is a full-stack ocean temperature monitoring application for marine biodiversity protection. It collects ocean temperature data for the Brazilian coast, calculates thermal risk scores, and generates AI-powered insights using Claude (Anthropic).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Frontend**: React + Vite + Tailwind CSS
- **Maps**: react-leaflet + Leaflet
- **Charts**: Recharts
- **AI**: Anthropic Claude (claude-sonnet-4-6) via Replit AI Integrations
- **Build**: esbuild (CJS bundle)

## Features

1. **Dashboard** - Real-time overview with KPI cards, traffic-light risk semaphore, and regional risk profiles table
2. **Heatmap** - Interactive Leaflet map showing ocean temperature anomalies on the Brazilian coast (lat -35 to 5, lon -50 to -25), colored by risk level
3. **Temperature Data** - Sortable data table with historical charts per region (Recharts)
4. **AI Insights** - Claude-powered analysis of thermal anomalies: diagnosis, vulnerable species, immediate actions, 30-day projections

## Risk Model

```
score = (current_temp - historical_avg) / historical_std_dev

Normal   → score < 1.0  (green)
Attention → score 1.0–2.0 (yellow)
Critical  → score > 2.0  (red)
```

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/             # Express 5 API server
│   │   └── src/
│   │       ├── routes/
│   │       │   ├── temperature.ts  # GET /api/temperature, /api/temperature/:id
│   │       │   ├── heatmap.ts      # GET /api/heatmap
│   │       │   ├── regions.ts      # GET /api/regions/risk-summary
│   │       │   └── insights.ts     # POST /api/insights (Claude AI)
│   │       └── lib/
│   │           ├── ocean-data.ts   # Data generation (16 Brazilian coast regions)
│   │           └── scheduler.ts    # 6-hour periodic data collection
│   └── ecomonitor/             # React + Vite frontend
│       └── src/
│           ├── pages/          # Dashboard, Heatmap, Temperature, Insights
│           └── components/     # Layout, UI components
├── lib/
│   ├── api-spec/               # OpenAPI 3.1 spec + Orval codegen config
│   ├── api-client-react/       # Generated React Query hooks
│   ├── api-zod/                # Generated Zod schemas
│   ├── db/                     # Drizzle ORM + PostgreSQL
│   │   └── src/schema/
│   │       ├── temperature_readings.ts  # Ocean temperature data table
│   │       └── insights_cache.ts       # AI insights cache (1hr TTL)
│   └── integrations-anthropic-ai/      # Anthropic Claude integration
└── scripts/                    # Utility scripts
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/healthz | Health check |
| GET | /api/temperature | List temperature points with risk scores |
| GET | /api/temperature/:id | Historical data for a specific point |
| GET | /api/heatmap | Optimized heatmap data |
| POST | /api/insights | Generate AI insights for a region |
| GET | /api/regions/risk-summary | Risk summary by region |
| POST | /api/scheduler/trigger | Manually trigger data collection |

## Data Sources

- 16 monitored regions along the Brazilian coast
- Data simulated from NOAA ERDDAP patterns with realistic anomaly distribution
- Scheduler collects new readings every 6 hours automatically
- AI insights cached for 1 hour per region

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client from OpenAPI spec
- `pnpm --filter @workspace/db run push` — apply DB schema changes

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-set by Replit)
- `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` — Anthropic proxy URL (auto-set)
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` — Anthropic API key proxy (auto-set)
- `PORT` — Server port (auto-set by Replit per artifact)
