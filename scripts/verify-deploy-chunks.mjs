#!/usr/bin/env node
/**
 * Quick deploy verification — confirms that a freshly built/deployed app does
 * not leave the browser in the "stale dynamic chunk" failure mode that we
 * recently auto-recover from in src/main.tsx.
 *
 * What it does (no headless browser required):
 *   1. Fetches the target origin's `index.html`.
 *   2. Extracts every `/assets/*.js` reference (entry + modulepreload links).
 *   3. HEAD-checks each chunk — any 404 means the deploy is inconsistent
 *      and existing sessions WILL hit the stale-chunk error.
 *   4. Verifies a `TechnicalAuditsTab-*.js` chunk exists (smoke-tests the
 *      lazy route that triggered the original error report).
 *
 * Usage:
 *   node scripts/verify-deploy-chunks.mjs                       # default: published URL
 *   node scripts/verify-deploy-chunks.mjs https://my-preview... # custom origin
 *
 * Exit code 0 = OK, 1 = problem detected (CI-friendly).
 */

const DEFAULT_TARGET = "https://longevidade.ai";
const target = (process.argv[2] ?? DEFAULT_TARGET).replace(/\/+$/, "");

const FOCUS_CHUNK = /TechnicalAuditsTab-[A-Za-z0-9_-]+\.js$/;

function log(label, msg) {
  // eslint-disable-next-line no-console
  console.log(`[verify-deploy] ${label} ${msg}`);
}

async function main() {
  log("→", `target = ${target}`);

  const indexRes = await fetch(`${target}/index.html`, { cache: "no-store" });
  if (!indexRes.ok) {
    log("✗", `index.html HTTP ${indexRes.status}`);
    process.exit(1);
  }
  const html = await indexRes.text();

  // Pull every /assets/*.js path (script src + modulepreload href).
  const chunks = Array.from(
    new Set(
      Array.from(html.matchAll(/["'](\/assets\/[^"']+?\.js)["']/g)).map(
        (m) => m[1],
      ),
    ),
  );

  if (chunks.length === 0) {
    log("✗", "no /assets/*.js references found in index.html");
    process.exit(1);
  }
  log("ℹ", `${chunks.length} chunk reference(s) found`);

  const results = await Promise.all(
    chunks.map(async (path) => {
      try {
        const r = await fetch(`${target}${path}`, {
          method: "HEAD",
          cache: "no-store",
        });
        return { path, status: r.status, ok: r.ok };
      } catch (e) {
        return { path, status: 0, ok: false, error: String(e) };
      }
    }),
  );

  const broken = results.filter((r) => !r.ok);
  for (const r of results) {
    log(r.ok ? "✓" : "✗", `HTTP ${r.status}  ${r.path}`);
  }

  const focusHit = results.find((r) => FOCUS_CHUNK.test(r.path));
  if (!focusHit) {
    log("✗", "TechnicalAuditsTab chunk not referenced from index.html");
    process.exit(1);
  }
  if (!focusHit.ok) {
    log("✗", `TechnicalAuditsTab chunk missing on server: ${focusHit.path}`);
    process.exit(1);
  }
  log("✓", `TechnicalAuditsTab chunk OK: ${focusHit.path}`);

  if (broken.length > 0) {
    log("✗", `${broken.length} chunk(s) missing — stale-chunk errors WILL happen`);
    process.exit(1);
  }

  log("✓", "deploy verified — no stale-chunk risk for new sessions");
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("[verify-deploy] fatal", e);
  process.exit(1);
});