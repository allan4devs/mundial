// Vercel runs this before installing/building a deployment.
// Exit 0 = ignore deployment, exit 1 = continue.
const isProduction = process.env.VERCEL_ENV === "production";
const branch = process.env.VERCEL_GIT_COMMIT_REF || "";

if (!isProduction || branch !== "main") {
  console.log(`Skipping Vercel build: env=${process.env.VERCEL_ENV || "unknown"}, branch=${branch || "unknown"}`);
  process.exit(0);
}

console.log("Building production from main");
process.exit(1);
