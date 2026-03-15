# 🌊 EcoMonitor SMPT

**Sistema de Monitoramento e Proteção Térmica Sistêmica**

A full-stack ocean temperature monitoring platform for marine biodiversity protection. EcoMonitor SMPT collects sea surface temperature data across the Brazilian coast, classifies thermal risk levels, visualizes anomalies on an interactive heatmap, and generates AI-powered conservation insights using Claude (Anthropic).

---

## ✨ Features

| Feature | Description |
|---|---|
| **Live Dashboard** | Real-time KPI cards, traffic-light risk semaphore, and ranked regional risk table |
| **Interactive Heatmap** | Leaflet map centered on the Brazilian coast with color-coded risk markers |
| **Temperature Data** | Sortable data table with per-region historical line charts |
| **AI Insights** | Claude-generated diagnosis, vulnerable species list, action items, and 30-day projections |
| **Auto Scheduler** | Automatic data collection every 6 hours across all 16 monitored regions |
| **Risk Caching** | AI insights cached per region for 1 hour to minimize API costs |

---

## 🗺️ Coverage Area

16 monitored regions along the Brazilian coast:

- Amazônia Azul – Norte
- Atol das Rocas
- Arquipélago de Fernando de Noronha
- Costa do Maranhão, Ceará, Rio Grande do Norte
- Costa da Paraíba e Pernambuco
- Costa de Alagoas e Sergipe
- Costa Norte e Sul da Bahia
- Abrolhos *(critical biodiversity hotspot)*
- Costa do Espírito Santo, Rio de Janeiro, São Paulo
- Costa do Paraná e Santa Catarina
- Costa do Rio Grande do Sul

---

## 🧮 Thermal Risk Model

Each geographic point is scored using a standardized anomaly index:

```
score = (current_temp − historical_avg) / historical_std_dev
```

| Score | Level | Color | Meaning |
|---|---|---|---|
| < 1.0 | **Normal** | 🟢 Green | Within expected range |
| 1.0 – 2.0 | **Attention** | 🟡 Yellow | Elevated — monitor closely |
| > 2.0 | **Critical** | 🔴 Red | Thermal anomaly — action required |

---

## 🏗️ Architecture

```
EcoMonitor SMPT
├── artifacts/
│   ├── api-server/              # Express 5 REST API
│   │   └── src/
│   │       ├── routes/
│   │       │   ├── temperature.ts   # GET /api/temperature, /api/temperature/:id
│   │       │   ├── heatmap.ts       # GET /api/heatmap
│   │       │   ├── regions.ts       # GET /api/regions/risk-summary
│   │       │   └── insights.ts      # POST /api/insights  ← Claude AI
│   │       └── lib/
│   │           ├── ocean-data.ts    # Data generation for 16 regions
│   │           └── scheduler.ts     # 6-hour periodic collection
│   │
│   └── ecomonitor/              # React + Vite frontend
│       └── src/
│           ├── pages/
│           │   ├── dashboard.tsx    # Overview & risk semaphore
│           │   ├── heatmap.tsx      # Leaflet interactive map
│           │   ├── temperature.tsx  # Data table + history charts
│           │   └── insights.tsx     # AI analysis panel
│           └── components/
│               └── layout/          # Sidebar navigation
│
├── lib/
│   ├── api-spec/openapi.yaml    # Single source of truth for all contracts
│   ├── api-client-react/        # Auto-generated React Query hooks (Orval)
│   ├── api-zod/                 # Auto-generated Zod schemas (Orval)
│   ├── db/src/schema/
│   │   ├── temperature_readings.ts  # Ocean readings table
│   │   └── insights_cache.ts        # AI cache table (1hr TTL)
│   └── integrations-anthropic-ai/   # Claude API client
│
└── lib/api-spec/orval.config.ts # Codegen configuration
```

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 24 + TypeScript 5.9
- **Framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod v4 + drizzle-zod
- **AI**: Anthropic Claude (`claude-sonnet-4-6`) via Replit AI Integrations
- **Scheduler**: `setInterval` — collects data every 6 hours automatically

### Frontend
- **Framework**: React 18 + Vite
- **Maps**: Leaflet + react-leaflet
- **Charts**: Recharts
- **State/Data**: TanStack React Query (auto-generated hooks)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Animations**: Framer Motion

### Monorepo
- **Tooling**: pnpm workspaces
- **API Contract**: OpenAPI 3.1 → Orval codegen (React Query hooks + Zod schemas)
- **Build**: esbuild (backend), Vite (frontend)

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/healthz` | Health check |
| `GET` | `/api/temperature` | List points with risk scores (filter: `period`, `riskLevel`) |
| `GET` | `/api/temperature/:id` | 30-day history for a specific monitoring point |
| `GET` | `/api/heatmap` | Optimized intensity data for map rendering |
| `POST` | `/api/insights` | Generate Claude AI insights for a region |
| `GET` | `/api/regions/risk-summary` | Aggregated risk summary per region |
| `POST` | `/api/scheduler/trigger` | Manually trigger a new data collection cycle |

### Query Parameters

**`/api/temperature` and `/api/heatmap`**

| Parameter | Type | Values | Default |
|---|---|---|---|
| `period` | string | `7d`, `30d`, `90d` | `7d` |
| `riskLevel` | string | `normal`, `attention`, `critical` | *(all)* |

### POST `/api/insights` — Request Body

```json
{
  "regionName": "Abrolhos",
  "latitude": -17.98,
  "longitude": -38.69,
  "temperature": 27.8,
  "historicalAvg": 25.2,
  "historicalStdDev": 1.3,
  "riskLevel": "critical",
  "trend7d": 0.15
}
```

### POST `/api/insights` — Response

```json
{
  "regionName": "Abrolhos",
  "riskLevel": "critical",
  "diagnosis": "A região dos Abrolhos apresenta anomalia...",
  "vulnerableSpecies": ["Coral cérebro", "Peixe-papagaio", "Tartaruga-verde", "Manta-raia", "Camarão-pistola"],
  "immediateActions": ["Suspender atividades de pesca de arrasto", "..."],
  "projection30d": "A tendência de aquecimento sugere...",
  "generatedAt": "2026-03-15T12:00:00.000Z",
  "cached": false
}
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 24+
- pnpm
- PostgreSQL (auto-provisioned by Replit)
- Anthropic AI access (auto-provisioned by Replit AI Integrations)

### Development

```bash
# Install dependencies
pnpm install

# Push database schema
pnpm --filter @workspace/db run push

# Start the API server
pnpm --filter @workspace/api-server run dev

# Start the frontend
pnpm --filter @workspace/ecomonitor run dev
```

### Regenerate API Client (after editing `openapi.yaml`)

```bash
pnpm --filter @workspace/api-spec run codegen
```

### Type Check

```bash
pnpm run typecheck
```

---

## 🌡️ Data Collection

On startup, the API server automatically:
1. Runs an **initial data collection** for all 16 Brazilian coast regions
2. Schedules **periodic collection every 6 hours**

Each collection cycle inserts ~96 georeferenced readings (6 points × 16 regions) with temperature, historical baseline, risk score, and 7-day trend.

You can also trigger collection manually from the dashboard via the **"Force Data Sync"** button or via `POST /api/scheduler/trigger`.

---

## 🤖 AI Insights — Prompt Design

The Claude prompt is structured to produce oceanographic expertise:

```
System: Você é um especialista em oceanografia e ecologia marinha brasileira.
        Analise os dados e gere insights de conservação em português do Brasil.

User:   Região: {regionName} | Coordenadas: {lat}, {lng}
        Temperatura atual: {temp}°C | Média histórica: {avg}°C | Desvio: {std}°C
        Nível de risco: {level} | Tendência (7 dias): {trend}

        Gere JSON com: diagnosis, vulnerableSpecies[], immediateActions[], projection30d
```

Responses are cached in PostgreSQL for **1 hour per region** to reduce API costs.

---

## 📚 Academic Context

This project was developed for the **Legislação e Direito Ambiental** discipline (Computer Engineering and Science) at a Brazilian university. It provides robust technical data to:

- Support public policies for marine biodiversity conservation
- Provide scientifically grounded evidence for dynamic *Unidades de Conservação* (protected areas)
- Enable data-driven environmental legal frameworks under Brazilian environmental law

---

## 📄 License

MIT
