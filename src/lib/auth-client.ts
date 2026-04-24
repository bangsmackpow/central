import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // By omitting baseURL, it defaults to the current window origin.
  // This is the most reliable way to avoid CORS issues on Cloudflare Pages.
});
