# Agent Handoff - Central Dashboard

## 🎯 Current Status
The project has successfully reached **Phase 3 Completion**. It is a fully functional dashboard for managing Cloudflare and Docker-based projects.

### 🚀 Key Accomplishments
- **Auth**: Better-Auth integrated with D1.
- **Infrastructure**: Dynamic link generation for Cloudflare (Pages/D1/R2) and Docker (Portainer Stacks/Logs).
- **Auto-Discovery**: Server-side utility `src/lib/github.ts` scans GitHub repos for infrastructure markers (`wrangler.toml`, `docker-compose.yml`).
- **Security**: All secrets in D1 are encrypted with AES-256-GCM.
- **UX**: Sidebar reordering with `@hello-pangea/dnd`.

## 🛠 Active Technical Context
- **Runtime**: Cloudflare Pages Functions (Hono).
- **Database**: D1 (Drizzle ORM).
- **Environment**: Requires `nodejs_compat` and `MASTER_ENCRYPTION_KEY` (32 chars).
- **Important**: D1 `UPDATE`/`DELETE` queries must not use table prefixes in the `WHERE` clause. Use `sql` snippets for these.

## 📋 Outstanding Tasks / Next Steps
1. **Intelligence UI Expansion**: The "Intelligence" tab is functional but could use a better form layout for editing all fields (Instructions URL, Models, etc.) at once.
2. **Global Search**: Implement a search bar to find projects by name, description, or documentation content.
3. **Agent SDK Integration**: Start building the actual Agentic logic (e.g., a "Chat with Project" feature using Vectorize).
4. **Log Streaming**: The current log links point to Portainer; implementing a proxy to stream logs directly into the dashboard would be a major upgrade.

## 📌 Critical "Gotchas"
- Always use `mapProject` when querying D1 to ensure property name normalization.
- When adding new columns to Drizzle, manually sync the `migrations/` folder for Wrangler.
