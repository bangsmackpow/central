export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: string;
  thumbnailUrl: string | null;
  
  // GitHub Integration
  githubRepoId?: number | null;
  githubRepoFullName?: string | null;
  
  // Cloudflare Integration
  isCloudflareProject?: boolean | null;
  cloudflareProjectName?: string | null;
  cloudflareD1Id?: string | null;
  cloudflareR2BucketName?: string | null;

  // Docker Integration
  isDockerProject?: boolean | null;
  serverId?: string | null;
  portainerEndpointId?: number | null;
  portainerStackName?: string | null;
  
  // Custom URLs
  prodUrl?: string | null;
  stagingUrl?: string | null;
  
  // AI / Agent Intelligence
  codingAgents?: string | null;
  primaryModel?: string | null;
  agentInstructionsUrl?: string | null;
  order: number;

  createdAt: Date;
  updatedAt: Date;
  quickLinks?: QuickLink[];
}

export interface QuickLink {
  id: string;
  projectId: string;
  label: string;
  url: string;
  order: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  token: string;
}

export interface Settings {
  id: string;
  userId: string;
  githubPat?: string | null;
  githubUsername?: string | null;
  cloudflareAccountId?: string | null;
}

export interface Server {
  id: string;
  userId: string;
  name: string;
  url: string;
  apiKey: string;
  createdAt: Date;
  updatedAt: Date;
  hasKey?: boolean; // For frontend masking
}

export type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  MASTER_ENCRYPTION_KEY: string;
  ASSETS: { fetch: typeof fetch };
};

export type Variables = {
  user: User;
  session: Session;
};
