import { handle } from "hono/cloudflare-pages";
import { app } from "../src/server";

export const onRequest = handle(app);
