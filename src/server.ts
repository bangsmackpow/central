import { Hono } from "hono";
import { eq, and, asc, sql } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getAuth } from "./auth";
import { getDb } from "./db";
import { projects, quickLinks, settings, servers } from "./db/schema";
import { Bindings, Variables, Project, Server } from "./types";
import { encrypt, decrypt, isEncrypted } from "./lib/crypto";
import { syncProjectMetadata } from "./lib/github";
import { fetchDockerContext } from "./lib/portainer";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Better Auth routes
app.all("/api/auth/*", async (c) => {
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
  c.set("user", session.user as any);
  c.set("session", session.session as any);
  await next();
});

/**
 * Maps raw database rows to the camelCase Project interface.
 */
function mapProject(row: any): Project {
  if (!row) return row;
  return {
    id: row.id,
    userId: row.user_id || row.userId,
    name: row.name,
    description: row.description,
    status: row.status,
    thumbnailUrl: row.thumbnail_url || row.thumbnailUrl,
    githubRepoId: row.github_repo_id || row.githubRepoId,
    githubRepoFullName: row.github_repo_full_name || row.githubRepoFullName,
    isCloudflareProject: Boolean(row.is_cloudflare_project || row.isCloudflareProject),
    cloudflareProjectName: row.cloudflare_project_name || row.cloudflareProjectName,
    cloudflareD1Id: row.cloudflare_d1_id || row.cloudflareD1Id,
    cloudflareR2BucketName: row.cloudflare_r2_bucket_name || row.cloudflareR2BucketName,
    isDockerProject: Boolean(row.is_docker_project || row.isDockerProject),
    serverId: row.server_id || row.serverId,
    portainerEndpointId: row.portainer_endpoint_id || row.portainerEndpointId,
    portainerStackName: row.portainer_stack_name || row.portainerStackName,
    prodUrl: row.prod_url || row.prodUrl,
    stagingUrl: row.staging_url || row.stagingUrl,
    codingAgents: row.coding_agents || row.codingAgents,
    primaryModel: row.primary_model || row.primaryModel,
    agentInstructionsUrl: row.agent_instructions_url || row.agentInstructionsUrl,
    order: row.order ?? 0,
    createdAt: new Date(row.created_at || row.createdAt),
    updatedAt: new Date(row.updated_at || row.updatedAt),
  };
}

function mapServer(row: any): Server {
  return {
    id: row.id,
    userId: row.user_id || row.userId,
    name: row.name,
    url: row.url,
    apiKey: "", // Masked
    hasKey: !!(row.api_key || row.apiKey),
    createdAt: new Date(row.created_at || row.createdAt),
    updatedAt: new Date(row.updated_at || row.updatedAt),
  };
}

// --- Settings Endpoints ---

api.get("/settings", async (c) => {
  const db = getDb(c.env.DB);
  const user = c.get("user");
  const userSettings = await db.select().from(settings).where(eq(settings.userId, user.id)).get();
  if (!userSettings) return c.json({ githubUsername: "", cloudflareAccountId: "" });
  return c.json({
    githubUsername: userSettings.githubUsername,
    cloudflareAccountId: userSettings.cloudflareAccountId,
    hasPat: !!userSettings.githubPat,
  });
});

const settingsSchema = z.object({
  githubUsername: z.string().optional(),
  githubPat: z.string().optional(),
  cloudflareAccountId: z.string().optional(),
});

api.post("/settings", zValidator("json", settingsSchema), async (c) => {
  const db = getDb(c.env.DB);
  const user = c.get("user");
  const body = c.req.valid("json");
  const masterKey = c.env.MASTER_ENCRYPTION_KEY;

  if (!masterKey) return c.json({ error: "Server encryption not configured" }, 500);

  const existing = await db.select().from(settings).where(eq(settings.userId, user.id)).get();

  let finalPat = body.githubPat;
  if (finalPat) finalPat = await encrypt(finalPat, masterKey);
  else if (existing) finalPat = existing.githubPat;

  if (existing) {
    await db.update(settings)
      .set({
        githubUsername: body.githubUsername ?? existing.githubUsername,
        githubPat: finalPat,
        cloudflareAccountId: body.cloudflareAccountId ?? existing.cloudflareAccountId,
      })
      .where(sql`user_id = ${user.id}`);
  } else {
    await db.insert(settings).values({
      id: crypto.randomUUID(),
      userId: user.id,
      githubUsername: body.githubUsername,
      githubPat: finalPat,
      cloudflareAccountId: body.cloudflareAccountId,
    });
  }
  return c.json({ success: true });
});

// --- Server Endpoints ---

api.get("/servers", async (c) => {
  const db = getDb(c.env.DB);
  const user = c.get("user");
  const serverList = await db.select().from(servers).where(eq(servers.userId, user.id)).orderBy(asc(servers.name));
  return c.json(serverList.map(mapServer));
});

const serverSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  apiKey: z.string().optional(),
});

api.post("/servers", zValidator("json", serverSchema), async (c) => {
  const db = getDb(c.env.DB);
  const user = c.get("user");
  const body = c.req.valid("json");
  const masterKey = c.env.MASTER_ENCRYPTION_KEY;

  if (!masterKey) return c.json({ error: "Encryption not configured" }, 500);

  const encryptedKey = body.apiKey ? await encrypt(body.apiKey, masterKey) : "";

  const id = crypto.randomUUID();
  await db.insert(servers).values({
    id,
    userId: user.id,
    name: body.name,
    url: body.url,
    apiKey: encryptedKey,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return c.json({ id, success: true });
});

api.delete("/servers/:id", async (c) => {
  const db = getDb(c.env.DB);
  const user = c.get("user");
  const id = c.req.param("id");
  
  await db.delete(servers).where(sql`id = ${id} AND user_id = ${user.id}`);
  return c.json({ success: true });
});

// --- GitHub Integration Endpoints ---

api.get("/github/repos", async (c) => {
  const db = getDb(c.env.DB);
  const user = c.get("user");
  const masterKey = c.env.MASTER_ENCRYPTION_KEY;

  const userSettings = await db.select().from(settings).where(eq(settings.userId, user.id)).get();
  if (!userSettings?.githubPat) return c.json({ error: "GitHub PAT not configured" }, 400);

  let pat = userSettings.githubPat;
  if (isEncrypted(pat)) {
    try { pat = await decrypt(pat, masterKey); } catch (e) { return c.json({ error: "Decryption failed" }, 500); }
  }

  const response = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
    headers: {
      "Authorization": `token ${pat}`,
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "Central-Dashboard",
    },
  });

  if (!response.ok) return c.json({ error: "Failed to fetch from GitHub" }, response.status);
  const repos = await response.json();
  return c.json(repos);
});

// --- Project Endpoints ---

api.get("/projects", async (c) => {
  const db = getDb(c.env.DB);
  const user = c.get("user");
  try {
    const projectsList = await db.query.projects.findMany({
      where: eq(projects.userId, user.id),
      with: { quickLinks: true },
      orderBy: [asc(projects.order)],
    });
    return c.json(projectsList.map(p => ({ ...mapProject(p), quickLinks: p.quickLinks })));
  } catch (e: any) {
    const rawList = await db.select().from(projects).where(eq(projects.userId, user.id)).orderBy(asc(projects.order));
    return c.json(rawList.map(mapProject));
  }
});

const projectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  status: z.enum(["active", "archived", "pending"]).default("active"),
  githubRepoId: z.number().optional().nullable(),
  githubRepoFullName: z.string().optional().nullable(),
  isCloudflareProject: z.boolean().default(false),
  cloudflareProjectName: z.string().optional().nullable(),
  cloudflareD1Id: z.string().optional().nullable(),
  cloudflareR2BucketName: z.string().optional().nullable(),
  isDockerProject: z.boolean().default(false),
  serverId: z.string().optional().nullable(),
  portainerEndpointId: z.number().optional().nullable(),
  portainerStackName: z.string().optional().nullable(),
  prodUrl: z.string().url().optional().nullable().or(z.literal("")),
  stagingUrl: z.string().url().optional().nullable().or(z.literal("")),
  codingAgents: z.string().optional().nullable(),
  primaryModel: z.string().optional().nullable(),
  agentInstructionsUrl: z.string().optional().nullable(),
});

api.post("/projects", zValidator("json", projectSchema), async (c) => {
  const db = getDb(c.env.DB);
  const user = c.get("user");
  const body = c.req.valid("json");
  const masterKey = c.env.MASTER_ENCRYPTION_KEY;

  const userSettings = await db.select().from(settings).where(eq(settings.userId, user.id)).get();
  let finalData = { ...body };

  if (body.githubRepoFullName && userSettings?.githubPat) {
    try {
      const meta = await syncProjectMetadata(body.githubRepoFullName, userSettings.githubPat, masterKey);
      finalData.description = meta.description || finalData.description;
      finalData.prodUrl = meta.prodUrl || finalData.prodUrl;
      finalData.isCloudflareProject = meta.isCloudflareProject;
      finalData.cloudflareProjectName = meta.cloudflareProjectName;
      finalData.cloudflareD1Id = meta.cloudflareD1Id;
      finalData.cloudflareR2BucketName = meta.cloudflareR2BucketName;
      finalData.isDockerProject = meta.isDockerProject;
      finalData.portainerStackName = meta.portainerStackName;
    } catch (e) {}
  }

  const lastProject = await db.select({ order: projects.order }).from(projects).where(eq(projects.userId, user.id)).orderBy(asc(projects.order)).get();
  const nextOrder = lastProject ? lastProject.order + 1 : 0;

  const id = crypto.randomUUID();
  await db.insert(projects).values({
    id,
    userId: user.id,
    ...finalData,
    order: nextOrder,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return c.json({ id, success: true });
});

api.post("/projects/:id/sync", async (c) => {
  const db = getDb(c.env.DB);
  const user = c.get("user");
  const id = c.req.param("id");
  const masterKey = c.env.MASTER_ENCRYPTION_KEY;

  const rawProject = await db.select().from(projects).where(and(eq(projects.id, id), eq(projects.userId, user.id))).get();
  if (!rawProject) return c.json({ error: "Project not found" }, 404);
  const project = mapProject(rawProject);

  const userSettings = await db.select().from(settings).where(eq(settings.userId, user.id)).get();

  if (!project.githubRepoFullName || !userSettings?.githubPat) return c.json({ error: "Insufficient data" }, 400);

  const meta = await syncProjectMetadata(project.githubRepoFullName, userSettings.githubPat, masterKey);

  await db.update(projects)
    .set({
      description: meta.description || project.description,
      prodUrl: meta.prodUrl || project.prodUrl,
      isCloudflareProject: meta.isCloudflareProject,
      cloudflareProjectName: meta.cloudflareProjectName || project.cloudflareProjectName,
      cloudflareD1Id: meta.cloudflareD1Id || project.cloudflareD1Id,
      cloudflareR2BucketName: meta.cloudflareR2BucketName || project.cloudflareR2BucketName,
      isDockerProject: meta.isDockerProject,
      portainerStackName: meta.portainerStackName || project.portainerStackName,
      updatedAt: new Date(),
    })
    .where(sql`id = ${id} AND user_id = ${user.id}`);

  return c.json({ success: true, meta });
});

api.get("/projects/:id/docker-context", async (c) => {
  const db = getDb(c.env.DB);
  const user = c.get("user");
  const id = c.req.param("id");
  const masterKey = c.env.MASTER_ENCRYPTION_KEY;

  const project = await db.select().from(projects).where(and(eq(projects.id, id), eq(projects.userId, user.id))).get();
  if (!project || !project.server_id || !project.portainer_stack_name) {
    return c.json({ error: "Docker info not configured for this project" }, 400);
  }

  const server = await db.select().from(servers).where(and(eq(servers.id, project.server_id), eq(servers.userId, user.id))).get();
  if (!server) return c.json({ error: "Server not found" }, 404);

  try {
    const context = await fetchDockerContext(
      server.url,
      server.api_key,
      project.portainer_endpoint_id || 1,
      project.portainer_stack_name,
      masterKey
    );
    return c.json(context);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// --- Quick Link Endpoints ---

const linkSchema = z.object({ label: z.string().min(1).max(50), url: z.string().url() });

api.post("/projects/:id/links", zValidator("json", linkSchema), async (c) => {
  const db = getDb(c.env.DB);
  const user = c.get("user");
  const projectId = c.req.param("id");
  const body = c.req.valid("json");
  const project = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, user.id))).get();
  if (!project) return c.json({ error: "Unauthorized" }, 401);
  const id = crypto.randomUUID();
  await db.insert(quickLinks).values({ id, projectId, label: body.label, url: body.url, order: 0 });
  return c.json({ id, success: true });
});

api.delete("/projects/:projectId/links/:linkId", async (c) => {
  const db = getDb(c.env.DB);
  const user = c.get("user");
  const { projectId, linkId } = c.req.param();
  const project = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, user.id))).get();
  if (!project) return c.json({ error: "Unauthorized" }, 401);
  await db.delete(quickLinks).where(sql`id = ${linkId} AND project_id = ${projectId}`);
  return c.json({ success: true });
});

api.patch("/projects/reorder", zValidator("json", z.object({ projectIds: z.array(z.string()) })), async (c) => {
  const db = getDb(c.env.DB);
  const user = c.get("user");
  const { projectIds } = c.req.valid("json");
  for (let i = 0; i < projectIds.length; i++) {
    await db.update(projects).set({ order: i }).where(sql`id = ${projectIds[i]} AND user_id = ${user.id}`);
  }
  return c.json({ success: true });
});

api.patch("/projects/:id", zValidator("json", projectSchema.partial()), async (c) => {
  const db = getDb(c.env.DB);
  const user = c.get("user");
  const id = c.req.param("id");
  const body = c.req.valid("json");
  await db.update(projects).set({ ...body, updatedAt: new Date() }).where(sql`id = ${id} AND user_id = ${user.id}`);
  return c.json({ success: true });
});

api.get("/projects/:id/docs", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const db = getDb(c.env.DB);
  const project = await db.select().from(projects).where(and(eq(projects.id, id), eq(projects.userId, user.id))).get();
  if (!project) return c.json({ error: "Not found" }, 404);
  const object = await c.env.BUCKET.get(`projects/${id}/docs/main.md`);
  if (!object) return c.json({ content: "" });
  const content = await object.text();
  return c.json({ content });
});

const docsSchema = z.object({ content: z.string().max(100000) });

api.post("/projects/:id/docs", zValidator("json", docsSchema), async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const db = getDb(c.env.DB);
  const project = await db.select().from(projects).where(and(eq(projects.id, id), eq(projects.userId, user.id))).get();
  if (!project) return c.json({ error: "Not found" }, 404);
  const { content } = c.req.valid("json");
  await c.env.BUCKET.put(`projects/${id}/docs/main.md`, content, { httpMetadata: { contentType: "text/markdown" } });
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

// Fallback to static assets for anything else (serves React app)
app.get("*", async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

export { app };
