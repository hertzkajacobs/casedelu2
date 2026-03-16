# Visitor Management & Intercom MVP

Monorepo MVP with kiosk, staff, admin, and Express + Prisma backend.

## Structure

- `apps/kiosk` - tablet-friendly visitor kiosk UI
- `apps/staff` - staff intercom alert dashboard
- `apps/admin` - admin configuration and logs
- `server` - Express API + Socket.IO + JWT auth + rate limiting
- `prisma/schema.prisma` - PostgreSQL data models

## Features

- Delivery, patient, and visitor check-in flows
- Digital visitor log + signature capture
- Socket-based staff notifications
- WebRTC signaling endpoints/events for intercom setup
- Admin routes for department management, routing, logs, call logs, devices
- Action audit logging
- Encrypted visitor payload storage (`encryptedBlob`)
- Kiosk API rate limiting and helmet/cors protections

## Quick start

1. `cp .env.example .env`
2. `npm install`
3. `npx prisma generate`
4. `npx prisma migrate dev --name init`
5. `npx tsx server/prisma-seed.ts`
6. `npm run dev`

## Docker

```bash
docker compose up --build
```

## Deployment targets

- Frontends can deploy to Vercel.
- `server` can deploy to Railway/Render/Supabase-compatible Node host.
