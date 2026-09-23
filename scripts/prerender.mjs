#!/usr/bin/env node
/**
 * Post-build static prerender. After `vite build`, this script spins up the
 * Vite preview server, drives Puppeteer over every public route, and writes
 * the fully-rendered HTML to dist/<route>/index.html. Netlify serves the
 * static HTML on cold hits; React hydrates on the client.
 *
 * Without prerender: Googlebot/LinkedIn/WhatsApp see an empty <div id="root">.
 * With prerender: they see the real headings, copy, images and JSON-LD —
 * which is the whole SEO unlock for a CSR SPA.
 *
 * IMPORTANT: this script MUST exit cleanly. The Vite preview server is spawned
 * as a detached process group and killed by group id; the script then calls
 * process.exit() explicitly. If the preview server is left running, Netlify
 * waits for the build's process tree to drain and eventually times out.
 *
 *   node scripts/prerender.mjs            # uses default port 4173
 *   node scripts/prerender.mjs --port 5050
 */
import { spawn } from "node:child_process";
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = dirname(__dirname);
const DIST = join(REPO_ROOT, "dist");
// Run Vite's CLI entry directly with the current Node binary — no `npx`
// wrapper process to orphan, no .bin symlink/shebang surprises in CI.
const VITE_BIN = join(REPO_ROOT, "node_modules", "vite", "bin", "vite.js");

if (!existsSync(DIST)) {
  console.error("dist/ does not exist. Run `npm run build` first.");
  process.exit(1);
}
if (!existsSync(VITE_BIN)) {
  console.error("vite binary not found at " + VITE_BIN);
  process.exit(1);
}

const portIdx = process.argv.indexOf("--port");
const PORT = portIdx > 0 ? Number(process.argv[portIdx + 1]) : 4173;
const ROUTES = ["/", "/about", "/services", "/gallery", "/cafe", "/contact"];
const baseUrl = `http://localhost:${PORT}`;

console.log(`Starting vite preview on :${PORT}…`);
const previewProcess = spawn(
  process.execPath,
  [VITE_BIN, "preview", "--port", String(PORT), "--strictPort"],
  {
    cwd: REPO_ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env },
    detached: true, // own process group so we can kill the whole tree
  }
);

const previewLog = [];
previewProcess.stdout.on("data", (c) => previewLog.push(c.toString()));
previewProcess.stderr.on("data", (c) => previewLog.push(c.toString()));
let previewExitedEarly = false;
previewProcess.on("exit", (code) => {
  if (code !== 0 && code !== null) previewExitedEarly = true;
});

/** Kill the preview server and its whole process group. Safe to call twice. */
function killPreview() {
  if (!previewProcess.pid || previewProcess.killed) return;
  try {
    process.kill(-previewProcess.pid, "SIGKILL"); // negative pid = process group
  } catch {
    try {
      previewProcess.kill("SIGKILL");
    } catch {
      /* already gone */
    }
  }
}

/** Clean up every resource and terminate the Node process with `code`. */
async function finish(code, browser) {
  try {
    if (browser) await browser.close();
  } catch {
    /* ignore */
  }
  killPreview();
  // Explicit exit: open child pipes / sockets would otherwise keep Node alive.
  process.exit(code);
}

// Make sure an unexpected crash still tears the server down.
process.on("uncaughtException", (err) => {
  console.error("Uncaught:", err);
  killPreview();
  process.exit(1);
});

// --- wait for the preview server to accept connections -----------------------
const startedAt = Date.now();
const READY_TIMEOUT_MS = 60000;
async function isUp() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1500);
    const res = await fetch(baseUrl + "/", { signal: ctrl.signal });
    clearTimeout(t);
    return res.status < 500;
  } catch {
    return false;
  }
}
while (!(await isUp())) {
  if (previewExitedEarly) {
    console.error("Vite preview exited before becoming ready:\n" + previewLog.join(""));
    await finish(1);
  }
  if (Date.now() - startedAt > READY_TIMEOUT_MS) {
    console.error(
      `Vite preview did not respond on ${baseUrl} within ${READY_TIMEOUT_MS / 1000}s:\n` +
        previewLog.join("")
    );
    await finish(1);
  }
  await new Promise((r) => setTimeout(r, 400));
}
console.log("vite preview ready.");

// --- drive Puppeteer over every route ----------------------------------------
console.log("Launching Puppeteer…");
let browser;
try {
  browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  // Capture every route into memory FIRST. We must not write into dist/
  // while the preview server is running: the moment dist/index.html is
  // overwritten with prerendered home markup, the preview server serves that
  // as the SPA fallback for every later route — and Puppeteer would capture
  // home content into /cafe/index.html, /about/index.html, etc.
  const captured = [];
  for (const route of ROUTES) {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(30000);
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    // Never run the OneKlick chat widget while baking static HTML: it would
    // call the live API at build time and bake its host element into the page.
    // The <script> tag itself stays in the capture and runs for real visitors.
    await page.setRequestInterception(true);
    page.on("request", (req) =>
      /\/widget\.js(\?|$)|\/public\/widget\//.test(req.url()) ? req.abort() : req.continue()
    );

    const url = `${baseUrl}${route}`;
    console.log(`  ${route} -> rendering…`);
    // domcontentloaded, not networkidle0 — autoplay videos hold connections open.
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    await page.waitForFunction(
      () => {
        // This callback is serialised and evaluated inside the page, so
        // `document` is the browser's — not a Node global.
        // eslint-disable-next-line no-undef
        const el = document.getElementById("root");
        return el && el.children.length > 0 && el.innerText.trim().length > 50;
      },
      { timeout: 30000 }
    );

    // Let Helmet flush <head> meta tags and the route content settle.
    await new Promise((r) => setTimeout(r, 600));

    const html = "<!DOCTYPE html>\n" + (await page.content());
    captured.push({ route, html });
    console.log(`    captured ${route} (${(html.length / 1024).toFixed(0)}KB)`);
    await page.close();
  }

  if (captured.length === 0) {
    console.error("Prerender produced no output.");
    await finish(1, browser);
  }

  // Stop the browser and the preview server BEFORE touching dist/, so the
  // server can never serve a half-written prerender to a later capture.
  await browser.close();
  browser = undefined;
  killPreview();

  for (const { route, html } of captured) {
    const outDir = route === "/" ? DIST : join(DIST, route.replace(/^\//, ""));
    await mkdir(outDir, { recursive: true });
    await writeFile(join(outDir, "index.html"), html);
    console.log(`  wrote ${outDir.replace(DIST, "dist")}/index.html`);
  }

  console.log("\nPrerender done. Routes:", captured.length);
  await finish(0, browser);
} catch (err) {
  console.error("Prerender failed:", err);
  await finish(1, browser);
}
