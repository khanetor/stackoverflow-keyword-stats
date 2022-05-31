# StackOverflow question statistics

This is a small demo on building a small web utility with [Deno](https://deno.land).

## Dependencies

- [Ky](https://github.com/sindresorhus/ky) - A small HTTP client for Deno
- [Oak](https://github.com/oakserver/oak) - A small middleware library for Deno HTTP server
- [Deno Driver - Postgres](https://github.com/denodrivers/postgres) - A postgres driver for Deno

## How to start

There are two components to this demo:

- Postgres database instance
- Deno web server

To start both in local Docker, from the project root directory, run

```sh
docker compose up -d
# Server should run at port 8000
```

## Server API

Take a look at [test.http](./test.http) for examples.

- Load API

```http
POST /load
Content-type: application/json
{
    "from": "2022-01-01",
    "to": "2022-05-31",
    "tags": ["deno", "node"]
}
```

- Statistics API

```http
GET /stats/:k
```
