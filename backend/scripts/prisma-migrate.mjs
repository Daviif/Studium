import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { parse } from "dotenv";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(projectRoot, ".env");
const envFileContents = fs.readFileSync(envPath, "utf8");
const envValues = parse(envFileContents);

if (!envValues.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from backend/.env");
}

const prismaExecutable = path.join(projectRoot, "node_modules", ".bin", "prisma");
const result = spawnSync(prismaExecutable, ["migrate", "dev", ...process.argv.slice(2)], {
  cwd: projectRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: envValues.DATABASE_URL,
  },
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);