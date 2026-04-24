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
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in the values.
3. Apply local migrations:
   ```bash
   npm run db:generate
   npx wrangler d1 migrations apply central-db --local
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### 4. Deployment
1. Build the project:
   ```bash
   npm run build
   ```
2. Deploy to Cloudflare Pages:
   ```bash
   npm run deploy
   ```
3. Apply production migrations:
   ```bash
   npx wrangler d1 migrations apply central-db --remote
   ```

## 🛠 Tech Stack
- **Framework**: Hono + Vite + React
- **Authentication**: Better-Auth
- **Database**: Cloudflare D1 (Drizzle ORM)
- **Storage**: Cloudflare R2
- **Styling**: Tailwind CSS + shadcn/ui (custom)
- **Markdown**: Unified/Remark/Rehype

## 📂 Project Structure
- `src/index.tsx`: Hono server (API & SSR proxy)
- `src/client.tsx`: React entry point
- `src/db/`: Database schema and client
- `src/components/`: React components
- `src/auth.ts`: Better-Auth server-side config
- `src/lib/auth-client.ts`: Better-Auth client-side config
