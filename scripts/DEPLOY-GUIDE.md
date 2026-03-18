# Evergreen ERP — Deploy Guide

## Architecture

```
┌─────────────────┐
│   nginx (:80)    │ ← Reverse proxy
│   /api/* → Go   │
│   /*     → Next │
├────────┬────────┤
│ Go API │ NextJS │
│ (:8080)│ (:3000)│
└────────┴────────┘
         │
    ┌────▼────┐
    │Supabase │
    │PostgreSQL│
    └─────────┘
```

- **Frontend**: Next.js 16 (React 19) — port 3000
- **Backend**: Go (chi router, pgx) — port 8080
- **Proxy**: nginx — port 80
- **Cron jobs**: Built into Go binary (BC sync 5min, ForthTrack 1min, follow-up 10min)

## NAS Details

- IP: 192.168.1.120
- User: Panuwat.Ja
- Project Path: /volume1/docker/evergreen
- App URL: http://192.168.1.120
- Domain: https://evergreen.chhindustry.com

## Docker Services (3 containers)

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| go-api | evergreen-api (Go binary ~15MB) | 8080 | API + Cron |
| nextjs | evergreen-web (Node.js) | 3000 | Frontend |
| nginx | nginx:alpine | 80 | Reverse proxy |

## Initial Setup

```bash
ssh Panuwat.Ja@192.168.1.120
cd /volume1/docker/evergreen

# Create .env.local
nano .env.local

# Build and start all 3 services
docker compose up -d --build
```

## Update Deployment

```bash
ssh Panuwat.Ja@192.168.1.120
cd /volume1/docker/evergreen

# Pull latest code then rebuild
docker compose up -d --build
```

## Container Logs

```bash
docker compose logs -f go-api      # Go API + cron logs
docker compose logs -f nextjs      # Next.js frontend
docker compose logs -f nginx       # Reverse proxy
```

## Health Check

```bash
curl http://192.168.1.120/api/configCheck
```
