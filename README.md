# Central Dashboard

A lightweight, production-ready project dashboard built with Hono, React, Better-Auth, Cloudflare D1, and R2.

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
2. **Setup Environment**: Copy `.env.example` to `.env` and fill in the values.
3. **Database Migrations**:
   ```bash
   npm run db:generate
   npx wrangler d1 migrations apply central-db --local
   ```
4. **Start Dev Server**:
   ```bash
   npm run dev
   ```

### 4. Deployment (Cloudflare Pages)
1. **GitHub Connection**: Link this repo to Cloudflare Pages.
2. **Environment Variables**: Add the following in the Cloudflare Dashboard:
    - `BETTER_AUTH_SECRET`: A long random string.
    - `BETTER_AUTH_URL`: Your production URL (e.g., `https://central.pages.dev`).
    - `VITE_BETTER_AUTH_URL`: Same as above.
    - `NPM_FLAGS`: `--legacy-peer-deps` (Critical for build success).
3. **Bindings**:
    - **D1 Database**: Bind `DB` to your `central-db`.
    - **R2 Bucket**: Bind `BUCKET` to your `central-assets`.
4. **Production Migrations**:
   ```bash
   npx wrangler d1 migrations apply central-db --remote
   ```

## 🛠 Tech Stack
- **Framework**: Hono + Vite + React
- **Authentication**: Better-Auth (D1 Adapter)
- **Database**: Cloudflare D1 (Drizzle ORM)
- **Storage**: Cloudflare R2
- **Validation**: Zod + Hono zValidator
- **Markdown**: Unified/Remark/Rehype with `rehype-sanitize`

## 📂 Project Structure
- `src/index.tsx`: Hono server (API & R2 Proxy)
- `src/db/schema.ts`: Drizzle schema (Users, Projects, Links)
- `src/types.ts`: Shared TypeScript interfaces
- `src/components/editor/`: XSS-safe Markdown editor
- `PROJECT_MEMORY.md`: Implementation history and technical decisions
- `agents.md`: Vision for AI Agent integration

## 🤝 Next Steps
- Implement "Create Project" modal in the UI.
- Add R2 image upload for project thumbnails.
- Integrate Cloudflare Vectorize for documentation search.
