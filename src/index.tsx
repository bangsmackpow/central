import { Hono } from "hono";
import { handle } from "@hono/cloudflare-pages";
import { getAuth } from "./auth";
import { getDb } from "./db";

type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Better Auth routes
app.on(["POST", "GET"], "/api/auth/**", async (c) => {
  const auth = getAuth(c.env.DB, c.env);
  return auth.handler(c.req.raw);
});

// API Routes (Protected)
const api = new Hono<{ Bindings: Bindings }>();

// Auth Middleware for API
api.use("*", async (c, next) => {
  const auth = getAuth(c.env.DB, c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("user", session.user);
  c.set("session", session.session);
  await next();
});

// Project endpoints
api.get("/projects", async (c) => {
  const db = getDb(c.env.DB);
  const projectsList = await db.query.projects.findMany({
    with: { quickLinks: true },
  });
  return c.json(projectsList);
});

api.get("/projects/:id/docs", async (c) => {
  const id = c.req.param("id");
  const object = await c.env.BUCKET.get(`projects/${id}/docs/main.md`);
  if (!object) return c.json({ content: "" });
  const content = await object.text();
  return c.json({ content });
});

api.post("/projects/:id/docs", async (c) => {
  const id = c.req.param("id");
  const { content } = await c.req.json();
  await c.env.BUCKET.put(`projects/${id}/docs/main.md`, content, {
    httpMetadata: { contentType: "text/markdown" },
  });
  return c.json({ success: true });
});

// Mount API
app.route("/api", api);

// R2 Public Proxy (if needed, or use direct public bucket URL)
app.get("/r2/:key{.+$}", async (c) => {
  const key = c.req.param("key");
  const object = await c.env.BUCKET.get(key);
  if (!object) return c.notFound();

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);

  return c.body(object.body, 200, Object.fromEntries(headers));
});

export default handle(app);
