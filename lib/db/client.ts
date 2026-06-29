import "server-only";

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@/lib/db/schema";

declare global {
  var diagnosiIaMysqlPool: mysql.Pool | undefined;
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

function createMysqlPool() {
  return mysql.createPool({
    uri: databaseUrl,
    connectionLimit: 10,
    timezone: "Z",
    supportBigNumbers: true,
  });
}

export const mysqlPool =
  globalThis.diagnosiIaMysqlPool ?? createMysqlPool();

if (process.env.NODE_ENV !== "production") {
  globalThis.diagnosiIaMysqlPool = mysqlPool;
}

export const db = drizzle(mysqlPool, {
  schema,
  mode: "default",
});
