# Project Memory - Central Dashboard

## 🧠 Architectural Summary
Central Dashboard is a specialized project management hub architected for the Cloudflare Edge. It bridges the gap between structured relational data (D1) and unstructured documentation/assets (R2).

### Technical Decisions
- **Edge Runtime**: Used Hono over Next.js for zero-latency cold starts and native integration with Cloudflare Workers/Pages Functions.
- **Authentication**: Better-Auth with D1 adapter was chosen for a robust, database-backed session model that remains lightweight and edge-compatible.
- **Multi-Tenancy**: The database schema and API routes are hardened to ensure strict data isolation between users.
- **Security**: 
    - R2 assets are served through an authenticated Hono proxy.
    - Markdown is sanitized using `rehype-sanitize` to prevent XSS.
    - All API inputs are validated via `zod` and `zValidator`.

### Implementation History
- **Phase 1**: Initial scaffolding with Hono, Vite, and React.
- **Phase 2**: Database schema design and D1/R2 bindings.
- **Phase 3**: Better-Auth integration and dependency conflict resolution (`drizzle` vs `better-auth`).
- **Phase 4**: Hardening Pass (Security, Types, Multi-tenancy).
- **Phase 5**: Production deployment and CI/CD setup via GitHub.

### Critical "Gotchas" Resolved
- **Dependency Conflicts**: `better-auth` requires specific versions of `drizzle-orm` and `drizzle-kit`.
- **NPM Peer Dependencies**: Cloudflare builds require `--legacy-peer-deps` via `NPM_FLAGS` environment variable to handle modern peer dependency trees.
- **Package Names**: Verified that `@radix-ui/react-button` and similar do not exist as standalone primitives in the NPM registry; standard HTML/Tailwind components are used instead.

## 📌 Current State
- ✅ Authentication (Email/Password)
- ✅ Project Registry (D1)
- ✅ Document Storage (R2)
- ✅ Secure Asset Proxy
- ✅ Automated CI/CD
