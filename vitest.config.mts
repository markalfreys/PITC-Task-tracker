import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

const root = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@\//, replacement: root },
      // "server-only" throws outside Next.js, so replace it with an empty module.
      { find: "server-only", replacement: `${root}node_modules/server-only/empty.js` },
    ],
  },
  test: {
    // Component tests switch to jsdom with a comment at the top of the file.
    environment: "node",
    exclude: [...configDefaults.exclude, ".next/**"],
  },
});
