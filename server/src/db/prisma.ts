import { execFileSync } from "node:child_process";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

export function sqlLit(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number") return Number.isFinite(val) ? String(val) : "0";
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  return "'" + String(val).replace(/'/g, "''") + "'";
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, keyHex] = storedHash.split(":");
  const keyBuf = Buffer.from(keyHex, "hex");
  const derivedBuf = scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return timingSafeEqual(keyBuf, derivedBuf);
}

export function generateSessionToken(): string {
  return "spw_" + randomBytes(28).toString("hex");
}

let pgAvailableCache: boolean | null = null;

export function isPostgresReachable(): boolean {
  if (pgAvailableCache !== null) return pgAvailableCache;
  try {
    execFileSync("psql", [DATABASE_URL, "-X", "-A", "-t", "-c", "SELECT 1;"], {
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 1500,
    });
    pgAvailableCache = true;
    return true;
  } catch {
    pgAvailableCache = false;
    return false;
  }
}

export function pgExec(sql: string): string {
  if (!isPostgresReachable()) return "";
  try {
    return execFileSync("psql", [DATABASE_URL, "-X", "-A", "-t", "-q", "-c", sql], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 4000,
    }).trim();
  } catch {
    return "";
  }
}

export function pgQueryJson<T = any>(sqlQuery: string): T[] {
  if (!isPostgresReachable()) return [];
  const wrapped = `SELECT COALESCE(json_agg(t), '[]'::json) FROM (${sqlQuery}) t;`;
  const out = pgExec(wrapped);
  if (!out) return [];
  try {
    return JSON.parse(out) as T[];
  } catch {
    return [];
  }
}
