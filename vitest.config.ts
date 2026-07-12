import { defineConfig } from "vitest/config";
import path from "node:path";
import fs from "node:fs";

// Load .env so integration tests reach the database (vitest does not load it).
const envFile = path.resolve(__dirname, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const match = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  }
}

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Integration tests share one database – run files sequentially.
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
