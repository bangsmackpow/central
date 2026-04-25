# Central Dashboard

A lightweight, production-ready project management hub built with Hono, React, Better-Auth, Cloudflare D1, and R2. Unified control for Cloudflare Edge and Docker/Portainer self-hosted environments.

## 🚀 Setup & Installation

### 1. Prerequisites
- Node.js & npm
- Cloudflare Account
- Wrangler CLI installed (`npm install -g wrangler`)

### 2. Infrastructure Setup
Create your D1 database and R2 bucket:
```bash
npx wrangler d1 create central-db
npx wrangler r2 bucket create central-assets
```
Update `wrangler.toml` with your `database_id`.

### 3. Local Development
1. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```
2. **Setup Environment**: Copy `.env.example` to `.env`.
3. **Database Migrations**:
   ```bash
   npx wrangler d1 migrations apply central-db --local
   ```
4. **Start Dev Server**:
   ```bash
   npm run dev
   ```

### 4. Deployment (Cloudflare Pages)
1. **GitHub Connection**: Link this repo to Cloudflare Pages.
2. **Settings > Functions**:
    - Add Compatibility Flag: `nodejs_compat` (Required for Better-Auth).
3. **Settings > Variables**:
    - `BETTER_AUTH_SECRET`: A long random string.
    - `BETTER_AUTH_URL`: `https://your-app.pages.dev`
    - `MASTER_ENCRYPTION_KEY`: A 32-character random string (AES-GCM secret).
    - `NPM_FLAGS`: `--legacy-peer-deps`
4. **Settings > Bindings**:
    - **D1 Database**: Bind `DB` to `central-db`.
    - **R2 Bucket**: Bind `BUCKET` to `central-assets`.
5. **Production Migrations**:
   ```bash
   npx wrangler d1 migrations apply central-db --remote
   ```

## 🛠 Features
- **Unified Infrastructure**: Manage Cloudflare Pages/Workers and Docker/Portainer stacks in one UI.
- **GitHub Integration**: Sync repositories, auto-discover infrastructure markers (`wrangler.toml`, `docker-compose.yml`), and generate surgical links to code/secrets/actions.
- **Intelligence Stack**: Track Coding Agents, AI Models, and Agent Instructions per project.
- **Secrets Security**: Bank-grade encryption (AES-256-GCM) for GitHub PATs and Portainer API Keys.
- **Documentation**: Markdown notes stored in R2 with XSS-safe rendering.
- **UX**: Drag-and-drop project reordering in the sidebar.

## 🤝 Project Links
- [Architectural Memory](./PROJECT_MEMORY.md)
- [AI & Agent Roadmap](./agents.md)
