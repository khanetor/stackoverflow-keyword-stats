import {
  Application,
  Router,
  RouterContext,
} from "https://deno.land/x/oak@v10.6.0/mod.ts";
import { Client } from "https://deno.land/x/postgres@v0.15.0/mod.ts";

import { fetchAll } from "./api.ts";
import { getStats, initTables, insert } from "./db.ts";

const client = new Client({
  user: Deno.env.get("POSTGRES_USER"),
  password: Deno.env.get("POSTGRES_PASSWORD"),
  database: Deno.env.get("POSTGRES_DB"),
  hostname: Deno.env.get("POSTGRES_HOST"),
  port: 5432,
});

await client.connect();

await initTables(client);

const port = 8000;
const app = new Application();
const router = new Router();

router.post("/load", async ({ request, response }: RouterContext<"/load">) => {
  const { from, to, tags } = await request.body({ type: "json" }).value;
  const fromDate = new Date(from as string);
  const toDate = new Date(to as string);
  let totalFetched = 0;
  let totalInserted = 0;
  for await (
    const questions of fetchAll(fromDate, toDate, tags as string[], 100)
  ) {
    totalFetched += questions.length
    totalInserted += await insert(client, questions);
  }

  response.body = { totalFetched, totalInserted };
});

router.get(
  "/stats/:k",
  async ({ params, response }: RouterContext<"/stats/:k">) => {
    const k = parseInt(params.k);
    const stats = await getStats(client, k);
    response.body = stats;
  },
);

app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener("listen", () => {
  console.log(`Listening on localhost:${port}`);
});

await app.listen({ port });
