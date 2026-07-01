import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (SSR error wrapper).
    server: { entry: "server" },
  },
  // Force a Node build so the Docker image runs on `node ./.output/server/index.mjs`
  // and so `better-sqlite3` native bindings work at runtime.
  nitro: {
    preset: "node-server",
  },
  vite: {
    ssr: {
      // better-sqlite3 ships a native .node binding — must be loaded by Node,
      // not bundled by Vite/Rollup.
      external: ["better-sqlite3"],
      noExternal: [],
    },
  },
});
