# Project Memory - Central Dashboard

## 🧠 Architectural Summary
Central Dashboard is a specialized project management hub architected for the Cloudflare Edge. It bridges the gap between structured relational data (D1) and unstructured documentation/assets (R2).

### Technical Decisions
- **Edge Runtime**: Used Hono over Next.js for zero-latency cold starts and native integration with Cloudflare Workers/Pages Functions.
- **Authentication**: Better-Auth with D1 adapter was chosen for a robust, database-backed session model that remains lightweight and edge-compatible.
- **Multi-Tenancy**: The database schema and API routes are hardened to ensure strict data isolation between users.
- **Security**: 
    - Secrets (GitHub PAT, Portainer Keys, Cloudflare Tokens) are **Encrypted-at-Rest** using AES-256-GCM via the Web Crypto API and a `MASTER_ENCRYPTION_KEY`.
    - R2 assets are served through an authenticated Hono proxy.
    - Markdown is sanitized using `rehype-sanitize` to prevent XSS.
    - All API inputs are validated via `zod` and `zValidator`.
- **Pulse Monitoring**: Implemented real-time health checks for GitHub Actions and Cloudflare builds, along with container status tracking for Docker.
- **Surgical Deep-Linking**: Implementation of dynamic link generation for Cloudflare (D1, R2, Pages, Workers) and Portainer (Stacks, Containers, Logs) based on **Just-In-Time (JIT)** API discovery.

### Implementation History
- **Phase 1**: Initial scaffolding with Hono, Vite, and React.
- **Phase 2**: Database schema design and D1/R2 bindings.
- **Phase 3**: Better-Auth integration and dependency conflict resolution.
- **Phase 4**: Hardening Pass (Security, Types, Multi-tenancy).
- **Phase 5**: Production deployment and CI/CD setup via GitHub.
- **Phase 6**: GitHub Integration & Admin Panel (Repo Sync, Promotion).
- **Phase 7**: Secrets Encryption (AES-GCM for PATs and API Keys).
- **Phase 8**: Docker & Portainer Integration (Server Management, Dynamic Log Links).
- **Phase 9**: Sidebar UX (Drag-and-Drop project reordering).
- **Phase 10**: Pulse Monitoring (Real-time GitHub/Cloudflare/Docker health indicators).

### Critical "Gotchas" Resolved
- **Cloudflare D1 SQL**: D1 rejects table prefixes in `UPDATE`/`DELETE` clauses. Resolved by using raw `sql` snippets.
- **Portainer Ephemeral IDs**: Containers change IDs frequently during CI/CD. Resolved by fetching current container hashes via API on every health check.
- **Pages vs Workers**: Distinct link structures handled via `isWorker` flag and dynamic link generator.

## 📌 Current State
- ✅ Authentication (Email/Password)
- ✅ Project Registry (D1) & Document Storage (R2)
- ✅ Secrets Encryption (AES-256-GCM)
- ✅ GitHub Repository Sync & Auto-Discovery
- ✅ Docker / Portainer Deep-Linking & Container Discovery
- ✅ Real-time Health "Pulse" (GitHub Actions & CF Builds)
- ✅ Sidebar Drag-and-Drop Reordering
- ✅ Automated CI/CD
