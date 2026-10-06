import { serve } from "@hono/node-server";
import fs from "node:fs";
import path from "node:path";
import { openDatabase } from "./db.ts";
import { createApp } from "./http.ts";

const port = Number(process.env.PORT ?? 8787);
const filename = process.env.SQLITE_PATH ?? path.join(process.cwd(), "data", "lumina.sqlite");
fs.mkdirSync(path.dirname(filename), { recursive: true });

const db = openDatabase(filename);
const app = createApp(db);

serve({ fetch: app.fetch, port }, () => {
  console.log(`Lúmina API en http://localhost:${port}`);
});
