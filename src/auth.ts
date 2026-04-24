import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "./db";

export const getAuth = (d1: D1Database, env: any) => {
  const baseURL = env.BETTER_AUTH_URL || "https://central-zua.pages.dev";
  
  return betterAuth({
    database: drizzleAdapter(getDb(d1), {
      provider: "sqlite",
    }),
    emailAndPassword: {
      enabled: true,
      signUp: {
        enabled: true
      }
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: baseURL,
    trustedOrigins: [
      "http://localhost:5173",
      "https://central-zua.pages.dev"
    ],
    // trustHost is often required on Cloudflare/Vercel
    advanced: {
      trustHost: true
    }
  });
};
