import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import devServer from "@hono/vite-dev-server";

export default defineConfig({
  plugins: [
    react(),
    devServer({
      entry: "src/index.tsx",
      exclude: [
        /^\/(?!api|r2|auth).+/, // Don't intercept static assets or frontend routes
        /^\/$/,
      ],
    }),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
