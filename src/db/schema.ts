import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// --- Auth Tables (Better-Auth) ---

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }),
});

// --- Dashboard Tables ---

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"),
  thumbnailUrl: text("thumbnail_url"),
  
  // GitHub Integration
  githubRepoId: integer("github_repo_id"),
  githubRepoFullName: text("github_repo_full_name"),
  
  // Cloudflare Integration
  isCloudflareProject: integer("is_cloudflare_project", { mode: "boolean" }).default(false),
  cloudflareProjectName: text("cloudflare_project_name"),
  cloudflareD1Id: text("cloudflare_d1_id"),
  cloudflareR2BucketName: text("cloudflare_r2_bucket_name"),
  
  // Custom URLs
  prodUrl: text("prod_url"),
  stagingUrl: text("staging_url"),
  
  // AI / Agent Intelligence
  codingAgents: text("coding_agents"), // comma separated or JSON
  primaryModel: text("primary_model"),
  agentInstructionsUrl: text("agent_instructions_url"),
  order: integer("order").notNull().default(0),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const quickLinks = sqliteTable("quick_links", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  url: text("url").notNull(),
  order: integer("order").notNull().default(0),
});

export const settings = sqliteTable("settings", {
  id: text("id").primaryKey(), // Usually 'global' or userId
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  githubPat: text("github_pat"),
  githubUsername: text("github_username"),
  cloudflareAccountId: text("cloudflare_account_id"),
});

// --- Relations ---

export const projectsRelations = relations(projects, ({ many, one }) => ({
  quickLinks: many(quickLinks),
  user: one(user, {
    fields: [projects.userId],
    references: [user.id],
  }),
}));

export const quickLinksRelations = relations(quickLinks, ({ one }) => ({
  project: one(projects, {
    fields: [quickLinks.projectId],
    references: [projects.id],
  }),
}));

export const userRelations = relations(user, ({ many }) => ({
  projects: many(projects),
  settings: many(settings),
}));
