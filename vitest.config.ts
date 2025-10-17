import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      reporter: ["text", "html"],
    },
    globals: true,
    include: ["tests/**/*.test.ts"],
  },
});
