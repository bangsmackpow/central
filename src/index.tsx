import { handle } from "@hono/cloudflare-pages";
import { app } from "./server";

export default handle(app);
