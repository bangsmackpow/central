export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  thumbnailUrl: string | null;
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

export type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  ASSETS: { fetch: typeof fetch };
};

export type Variables = {
  user: User;
  session: Session;
};
