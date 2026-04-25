# Project Memory - Central Dashboard

## 🧠 Architectural Summary
Central Dashboard is a specialized project management hub architected for the Cloudflare Edge. It bridges the gap between structured relational data (D1) and unstructured documentation/assets (R2).

### Technical Decisions
- **Edge Runtime**: Used Hono over Next.js for zero-latency cold starts and native integration with Cloudflare Workers/Pages Functions.
- **Authentication**: Better-Auth with D1 adapter was chosen for a robust, database-backed session model that remains lightweight and edge-compatible.
- **Multi-Tenancy**: The database schema and API routes are hardened to ensure strict data isolation between users.
- **Security**: 
    - Secrets (GitHub PAT, Portainer Keys) are **Encrypted-at-Rest** using AES-256-GCM via the Web Crypto API and a `MASTER_ENCRYPTION_KEY`.
    - R2 assets are served through an authenticated Hono proxy.
    - Markdown is sanitized using `rehype-sanitize` to prevent XSS.
    - All API inputs are validated via `zod` and `zValidator`.
- **Infrastructure Deep-Linking**: Implementation of dynamic link generation for Cloudflare (D1, R2, Pages) and Portainer (Stacks, Containers, Logs) based on real-time API discovery.

### Implementation History
- **Phase 1**: Initial scaffolding with Hono, Vite, and React.
- **Phase 2**: Database schema design and D1/R2 bindings.
- **Phase 3**: Better-Auth integration and dependency conflict resolution (`drizzle` vs `better-auth`).
- **Phase 4**: Hardening Pass (Security, Types, Multi-tenancy).
- **Phase 5**: Production deployment and CI/CD setup via GitHub.
- **Phase 6**: GitHub Integration & Admin Panel (Repo Sync, Promotion).
- **Phase 7**: Secrets Encryption (AES-GCM for PATs and API Keys).
- **Phase 8**: Docker & Portainer Integration (Server Management, Dynamic Log Links).
- **Phase 9**: Sidebar UX (Drag-and-Drop project reordering).

### Critical "Gotchas" Resolved
- **Cloudflare D1 SQL**: D1 rejects table prefixes in `UPDATE`/`DELETE` clauses (e.g., `projects.id`). Resolved by using raw SQL snippets for `WHERE` clauses in mutations.
- **Better-Auth Runtime**: Requires `nodejs_compat` compatibility flag on Cloudflare to access `node:async_hooks`.
- **Drizzle Relational API**: Some D1 versions struggle with Drizzle's relational query aliases. Implemented a `mapProject` normalization layer to ensure property consistency.

## 📌 Current State
- ✅ Authentication (Email/Password)
- ✅ Project Registry (D1) & Document Storage (R2)
- ✅ Secrets Encryption (AES-256-GCM)
- ✅ GitHub Repository Sync & Auto-Discovery
- ✅ Docker / Portainer Deep-Linking & Container Discovery
- ✅ Sidebar Drag-and-Drop Reordering
- ✅ Automated CI/CD
