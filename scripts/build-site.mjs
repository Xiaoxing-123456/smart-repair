import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { build } from "esbuild";

const exported = spawnSync(process.execPath, ["node_modules/next/dist/bin/next", "build"], {
  stdio: "inherit",
  env: { ...process.env, REPAIR_SITE_EXPORT: "1", NEXT_TELEMETRY_DISABLED: "1" },
});
if (exported.status !== 0) process.exit(exported.status || 1);

const assets = Object.create(null);
for (const entry of readdirSync("out", { recursive: true, withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const filename = [entry.parentPath, entry.name].join("/");
  assets["/" + filename.slice(4).replaceAll("\\", "/")] = readFileSync(filename).toString("base64");
}

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist/.openai", { recursive: true });
cpSync(".openai/hosting.json", "dist/.openai/hosting.json");
cpSync("drizzle", "dist/.openai/drizzle", { recursive: true });
await build({
  entryPoints: ["worker/index.mjs"],
  outfile: "dist/server/index.js",
  bundle: true,
  minify: true,
  format: "esm",
  plugins: [{
    name: "exported-next-assets",
    setup(build) {
      build.onResolve({ filter: /assets\.generated\.mjs$/ }, ({ path }) => ({ path, namespace: "exported" }));
      build.onLoad({ filter: /.*/, namespace: "exported" }, () => ({
        contents: JSON.stringify(assets),
        loader: "json",
      }));
    },
  }],
});
