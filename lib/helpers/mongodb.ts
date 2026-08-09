/**
 * Shared Mongo handle for the mundial / ufc / xtreme / wifi / dj routes.
 * The connection itself lives in lib/mongo.ts so a single pooled client is
 * reused across every project in this repo.
 */
export { getDb, closeClient } from "../mongo";
