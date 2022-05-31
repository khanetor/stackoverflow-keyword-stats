import { Client } from "https://deno.land/x/postgres@v0.15.0/mod.ts";
import { Question } from "./api.ts";

export async function initTables(client: Client): Promise<void> {
  const xa = client.createTransaction("init_tables");

  await xa.begin();
  await xa.queryObject`
  CREATE TABLE IF NOT EXISTS "questions" (
    "id" BIGINT PRIMARY KEY,
    "keywords" TEXT ARRAY NOT NULL,
    "answered" BOOLEAN NOT NULL
  )
  `;
  await xa.queryObject`
  TRUNCATE TABLE "questions"
  `;

  await xa.commit();
}

export async function insert(
  client: Client,
  questions: Question[],
): Promise<unknown> {
  if (questions.length === 0) {
    return;
  }

  const values: string = questions.map((q) =>
    `(${q.id}, '{${q.keywords}}', ${q.answered})`
  ).join(",");

  return await client.queryObject(`
    INSERT INTO questions("id", "keywords", "answered")
    VALUES ${values}
    ON CONFLICT("id")
    DO UPDATE SET ("keywords", "answered") = (EXCLUDED.keywords, EXCLUDED.answered)
  `);
}

export async function getStats(
  client: Client,
  k: number,
): Promise<[string, number, number, number][]> {
  const { rows } = await client.queryArray<[string, bigint, bigint, string]>(
    `
    WITH "keyword_flat" AS (
        SELECT
            UNNEST("keywords") AS "keyword",
            "answered"
        FROM
            "questions"
    ),
    "keyword_stats" AS (
        SELECT
            "keyword",
            COUNT("answered") AS "total",
            SUM(
                CASE WHEN "answered" = TRUE THEN
                    1
                ELSE
                    0
                END) AS "answered"
        FROM
            "keyword_flat"
        GROUP BY
            "keyword"
    )
    SELECT
        "keyword",
        "total",
        "answered",
        GREATEST(0, "total" - $K) * (1::float / GREATEST("total" - $K, 1)) * ("answered"::float / "total") AS "ratio"
    FROM
        "keyword_stats"
    ORDER BY "ratio" DESC
`,
    {
      k: k,
    },
  );

  return rows.map((
    row,
  ) => [row[0], Number(row[1]), Number(row[2]), parseFloat(row[3])]);
}
