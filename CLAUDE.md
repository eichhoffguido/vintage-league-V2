# VintageLeague — Culture Agent Platform

## Project Overview

**VintageLeague** is a community-first marketplace for vintage football jerseys.
Think StockX meets a collector's forum — not just a shop, but a trusted platform
built on authenticity, transparent pricing, and a real community.

> **Repo:** https://github.com/eichhoffguido/vintage-league-V2
> **Status:** ~70% Frontend done. Backend completion + production hardening needed.
> **Live:** vintageleague.app (via Vercel auto-deploy)

---

## Team

| Person | Role |
|---|---|
| **Klaus** | Lead Development (Claude Code) |
| **Guido** | Product Owner, Business Logic |

---

## Tech Stack

| Layer | Tool | Notes |
|---|---|---|
| Frontend | React 18.3 + TypeScript | Already built in repo |
| Build | Vite | Fast dev builds |
| UI | shadcn/ui + Radix UI + TailwindCSS | Do not replace |
| Database | Supabase (PostgreSQL) | EU-Frankfurt, DSGVO ✅ |
| Auth | Supabase Auth (JWT) | Email + Google OAuth |
| State | React Query (TanStack) | |
| Forms | React Hook Form + Zod | Type-safe validation |
| Routing | React Router v6 | |
| Payments | Stripe Connect | Multi-vendor payments |
| Storage | Supabase Storage | Jersey images |
| Deploy | Vercel | Auto-deploy on GitHub push |
| Testing | Vitest + Playwright | |
| Monitoring | Sentry | Error logging (Phase 4) |

**Local dev setup:**
```bash
git clone https://github.com/eichhoffguido/vintage-league-V2.git
cd vintage-league-V2
npm install
npm run dev
```

---

## Current State of the Repo

### Pages already built ✅
1. `Index.tsx` — Landing Page (16.7 KB)
2. `Auth.tsx` — Login / Signup (5 KB)
3. `Collection.tsx` — My Jersey Collection (11.7 KB)
4. `Trade.tsx` — Sell / Offer a Jersey (8.9 KB)
5. `Trades.tsx` — Trade Overview (7.9 KB)
6. `Community.tsx` — Forum / Community (11.2 KB)
7. `CommunityPost.tsx` — Single Post View (9 KB)
8. `NotFound.tsx` — 404 Page (0.7 KB)

### What's done ✅
- Frontend structure (all pages)
- Supabase client setup (anon key + project URL configured)
- Auth Provider (`useAuth` hook)
- UI Components (shadcn/ui complete)
- Routing (React Router with all pages)
- Project setup (Vite + TypeScript + Testing)

### What's missing ❌
- Complete DB Schema (SQL not yet fully deployed)
- API Integration (React Query hooks to backend)
- Payment Processing (Stripe Connect)
- Real-Time Updates (Supabase subscriptions)
- Production-Ready Security (RLS Policies)
- Image Upload (Supabase Storage integration)
- Audit Logging

---

## Architecture

```
Lovable (existing UI/UX)
        ↓ export
GitHub Repo (source of truth)
        ↓ Claude Code opens
Claude Code IDE (refactor, add RLS, migrations, types)
        ↓ push
Supabase EU-Frankfurt (DB, Auth, Storage, Real-Time, Edge Functions)
        ↓ Vercel deploy
vintageleague.app (Global CDN, auto-deploy on push)
```

---

## Database Schema

### Core Tables

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR,
  bio TEXT,
  avatar_url VARCHAR,
  role ENUM('buyer', 'seller', 'admin'),
  verified BOOLEAN DEFAULT false,
  reputation_score INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL -- Soft Delete (GDPR)
);

-- Jerseys
CREATE TABLE jerseys (
  id UUID PRIMARY KEY,
  seller_id UUID REFERENCES users(id),
  team VARCHAR NOT NULL,
  player_name VARCHAR,
  season VARCHAR,
  size VARCHAR,
  condition ENUM('like_new', 'good', 'fair', 'poor'),
  price_cents INTEGER,
  images VARCHAR[],
  description TEXT,
  verification_status ENUM('pending', 'verified', 'rejected'),
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  buyer_id UUID REFERENCES users(id),
  seller_id UUID REFERENCES users(id),
  jersey_id UUID REFERENCES jerseys(id),
  price_cents INTEGER,
  status ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled'),
  payment_intent_id VARCHAR, -- Stripe
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Forum Topics
CREATE TABLE forum_topics (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR NOT NULL,
  content TEXT,
  category VARCHAR,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);

-- Forum Posts
CREATE TABLE forum_posts (
  id UUID PRIMARY KEY,
  topic_id UUID REFERENCES forum_topics(id),
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);

-- Ratings
CREATE TABLE ratings (
  id UUID PRIMARY KEY,
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  transaction_id UUID REFERENCES transactions(id),
  stars INTEGER CHECK (stars >= 1 AND stars <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Log (DSGVO)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR,
  resource_type VARCHAR,
  resource_id VARCHAR,
  ip_address VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### RLS Policies

```sql
-- Users: only own profile
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_own_profile ON users
  FOR ALL USING (auth.uid()::text = id::text);

-- Transactions: visible to buyer & seller only
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY transactions_own ON transactions
  FOR ALL USING (
    auth.uid()::text = buyer_id::text
    OR auth.uid()::text = seller_id::text
  );

-- Forum Posts: public read
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY forum_posts_public ON forum_posts
  FOR SELECT USING (true);
```

### Indexes

```sql
CREATE INDEX idx_jerseys_seller_id ON jerseys(seller_id);
CREATE INDEX idx_jerseys_team_season ON jerseys(team, season);
CREATE INDEX idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX idx_forum_topics_category ON forum_topics(category);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
```

---

## Implementation Roadmap

### Phase 1 — Backend Schema (3–5 days)
- [ ] Supabase project in EU-Frankfurt
- [ ] Deploy SQL schema
- [ ] Configure RLS policies
- [ ] Supabase Auth (Email + Google OAuth)
- [ ] Supabase Storage for jersey images
- [ ] API keys in `.env`
- [ ] Test with Postman/CLI

### Phase 2 — API Integration (5–7 days)
- [ ] React Query hooks (`useGetJerseys`, `useCreateTrade`, etc.)
- [ ] TypeScript types generated from Supabase schema
- [ ] Type-safe API layer
- [ ] Error handling improvements
- [ ] Loading states & cache management
- [ ] Write tests (Vitest)

### Phase 3 — Feature Completion (3–5 days)
- [ ] Stripe Connect (multi-vendor payments)
- [ ] Real-time updates (Supabase subscriptions for Forum)
- [ ] Image upload (Supabase Storage)
- [ ] Search & filter optimization

### Phase 4 — Production Hardening (3–5 days)
- [ ] Auth flows testing
- [ ] RLS security testing
- [ ] Performance optimization (lazy loading, caching)
- [ ] Error logging (Sentry)
- [ ] Load testing

**Total: 14–22 days to production-ready MVP**

---

## DSGVO / GDPR Compliance

- **Server:** Supabase EU-Frankfurt + signed DPA
- **RLS:** Users only see their own data
- **Soft Deletes:** `deleted_at` timestamp — no hard deletes (except admin override)
- **Anonymization:** Data anonymized after 90 days (optional)
- **Audit Log:** Every critical action logged (user_id, IP, action, timestamp)
- **Data Export:** `GET /api/user/data/export` → JSON/CSV (Right of Portability)
- **Forum Posts:** Public read, but deletable by owner

---

## Cost Overview

| Phase | Monthly Cost |
|---|---|
| MVP (Month 1) | €0–20 |
| Growth (Month 3) | €55–95 |
| Scale (Year 1) | €300–1000+ |

Stripe fee: 2.9% + €0.30 per transaction.

---

## Development Rules

- **Do NOT rebuild from scratch** — complete and harden what exists
- Always use TypeScript — no `any` types
- All DB access must go through Supabase client with RLS enforced
- Never bypass RLS policies, even in edge functions
- All user-facing money values stored as `price_cents` (integer), never floats
- Soft deletes only — never hard-delete user or jersey data
- Every significant action must be written to `audit_log`
- Images stored in Supabase Storage only — never as base64 in DB
- Stripe `payment_intent_id` must be stored on every transaction
- Forum posts are public read — no authentication needed for reading

---

## Key React Query Hook Naming Convention

```
useGetJerseys         — fetch jersey listings
useGetJersey(id)      — single jersey detail
useCreateTrade        — create a trade offer
useGetTrades          — fetch trades for current user
useGetForumTopics     — fetch forum topics by category
useCreateForumPost    — post to forum
useGetUserProfile     — current user profile
useUpdateProfile      — update user profile
```
