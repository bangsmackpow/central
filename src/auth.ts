import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "./db";

export const getAuth = (d1: D1Database, env: any) => {
  return betterAuth({
    database: drizzleAdapter(getDb(d1), {
      provider: "sqlite",
    }),
    emailAndPassword: {
      enabled: true,
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [
      "http://localhost:5173",
      env.BETTER_AUTH_URL
    ],
    advanced: {
      useSecureCookies: true
    }
  });
};
