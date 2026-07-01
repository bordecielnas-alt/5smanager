process.env.INIT_DB_ONLY = "1";

try {
  const mod = await import("../.output/server/index.mjs");
  // Trigger DB init explicitly if exported; otherwise the boot side effect ran.
  if (mod && typeof mod.initializeDatabaseOnBoot === "function") {
    mod.initializeDatabaseOnBoot();
  }
} catch (error) {
  console.error("[db-init] failed", error);
  process.exit(1);
}
