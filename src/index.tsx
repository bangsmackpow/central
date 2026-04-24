import { Hono } from "hono";
import { handle } from "@hono/cloudflare-pages";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getAuth } from "./auth";
import { getDb } from "./db";
import { projects, quickLinks } from "./db/schema";
import { Bindings, Variables } from "./types";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Better Auth routes
app.on(["POST", "GET"], "/api/auth/**", async (c) => {
  const auth = getAuth(c.env.DB, c.env);
  return auth.handler(c.req.raw);
});

// API Routes (Protected)
const api = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Auth Middleware for API
api.use("*", async (c, next) => {
  const auth = getAuth(c.env.DB, c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  // Type cast for internal use
  c.set("user", session.user as any);
  c.set("session", session.session as any);
  await next();
});

// Project endpoints
api.get("/projects", async (c) => {
  const db = getDb(c.env.DB);
  const user = c.get("user");
  const projectsList = await db.query.projects.findMany({
    where: eq(projects.userId, user.id),
    with: { quickLinks: true },
  });
  return c.json(projectsList);
});

const projectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  status: z.enum(["active", "archived", "pending"]).default("active"),
});

api.post("/projects", zValidator("json", projectSchema), async (c) => {
  const db = getDb(c.env.DB);
  const user = c.get("user");
  const body = c.req.valid("json");

  const id = crypto.randomUUID();
  await db.insert(projects).values({
    id,
    userId: user.id,
    name: body.name,
    description: body.description,
    status: body.status,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return c.json({ id, success: true });
});

api.get("/projects/:id/docs", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const db = getDb(c.env.DB);
  
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.userId, user.id)),
  });
  if (!project) return c.json({ error: "Not found" }, 404);

  const object = await c.env.BUCKET.get(`projects/${id}/docs/main.md`);
  if (!object) return c.json({ content: "" });
  const content = await object.text();
  return c.json({ content });
});

const docsSchema = z.object({
  content: z.string().max(100000), // 100kb limit
});

api.post("/projects/:id/docs", zValidator("json", docsSchema), async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const db = getDb(c.env.DB);
  
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.userId, user.id)),
  });
  if (!project) return c.json({ error: "Not found" }, 404);

  const { content } = c.req.valid("json");
  await c.env.BUCKET.put(`projects/${id}/docs/main.md`, content, {
    httpMetadata: { contentType: "text/markdown" },
  });
  return c.json({ success: true });
});

// R2 Protected Proxy
api.get("/r2/:key{.+$}", async (c) => {
  const key = c.req.param("key");
  const object = await c.env.BUCKET.get(key);
  if (!object) return c.notFound();

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);

  return c.body(object.body, 200, Object.fromEntries(headers));
});

// Mount API
app.route("/api", api);

export default handle(app);
