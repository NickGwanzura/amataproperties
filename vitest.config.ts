import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@/lib/db/index": path.resolve(__dirname, "lib/db/index.ts"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["lib/**/*.test.ts"],
    setupFiles: [],
  },
});
