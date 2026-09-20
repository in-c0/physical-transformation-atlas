// Headless verification of the built site (apps/web/out) or a deployed URL:
// screenshots at desktop and phone widths, console errors, and a few
// structural probes. Uses the machine's shared Edge launcher, which guarantees
// profile cleanup; see D:/Projects/.tools/edge-session.mjs.
//
//   node tools/verify.mjs                 # serve out/ on :5178 and probe it
//   node tools/verify.mjs https://…       # probe a deployed origin
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { launchEdge } from "file:///D:/Projects/.tools/edge-session.mjs";
import { startServer } from "./serve-out.mjs";

const here = resolve(fileURLToPath(import.meta.url), "..");
const outDir = join(here, "..", "design", "current");
await mkdir(outDir, { recursive: true });

let origin = process.argv[2];
let server;
if (!origin) {
  server = await startServer(5178);
  origin = "http://127.0.0.1:5178";
}
const PAGES = [
  "/",
  "/matrix?cell=D.02:C.10",
  "/matrix?cell=D.11:C.17",
  "/matrix?cell=D.23:C.01",
  "/atlas",
  "/frontier",
  "/coverage",
  "/methods",
  "/phenomenon/seebeck-effect",
  "/phenomenon/marangoni-effect",
  "/e/disequilibrium/temperature-gradient",
  "/path/d4b83f7f17",
  "/path/87c18f5e4c",
  "/claim/seebeck-drives",
  "/source/seebeck-1826",
];
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, mobile: false },
  { name: "phone", width: 375, height: 812, mobile: true },
];

// axe-core runs once per page at the desktop width: WCAG 2.x A/AA rules, serious and critical
// violations fail the run. Loop-3 pass 6 made this a regression gate rather than an audit.
const axeSource = await readFile(join(here, "..", "node_modules", "axe-core", "axe.min.js"), "utf8");
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const edge = await launchEdge({ args: ["--window-size=1440,900"] });
const problems = [];
const axeSummary = [];
try {
  for (const vp of VIEWPORTS) {
    for (const path of PAGES) {
      const tab = await edge.newTab();
      const logs = [];
      await tab.send("Runtime.enable");
      await tab.send("Log.enable");
      await tab.send("Emulation.setDeviceMetricsOverride", {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.mobile,
      });
      await tab.goto(origin + path);
      await new Promise((r) => setTimeout(r, 2500));
      const info = await tab.eval(`(() => {
        const errs = (window.__pta_errors || []);
        return JSON.stringify({
          title: document.title,
          h1: document.querySelector('h1')?.textContent?.trim().slice(0, 80) || null,
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          cells: document.querySelectorAll('[role=gridcell]').length,
          drawer: !!document.querySelector('aside'),
          fonts: Array.from(document.fonts).filter(f => f.status === 'loaded').map(f => f.family).filter((v,i,a)=>a.indexOf(v)===i),
          text: document.body.innerText.slice(0, 400)
        });
      })()`);
      const meta = JSON.parse(info);
      const slug = path.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home";
      const png = await tab.screenshot();
      const file = join(outDir, `${vp.name}-${slug}.png`);
      await writeFile(file, png);
      if (!vp.mobile) {
        await tab.eval(axeSource);
        const axe = JSON.parse(
          await tab.eval(
            `axe.run(document, { runOnly: { type: "tag", values: ${JSON.stringify(AXE_TAGS)} } }).then(r => JSON.stringify(r.violations.map(v => ({ id: v.id, impact: v.impact, count: v.nodes.length, target: v.nodes[0]?.target?.[0], help: v.help }))))`,
          ),
        );
        for (const v of axe) {
          const line = `${path}: ${v.id} (${v.impact}) ×${v.count} at ${v.target} — ${v.help}`;
          axeSummary.push(line);
          if (v.impact === "serious" || v.impact === "critical") problems.push(`axe ${line}`);
        }
      }
      // A record page that fell through to the 404 page carries the bare site title; catch it.
      if (path !== "/" && meta.title === "Physical Transformation Atlas") problems.push(`${vp.name} ${path}: not found (bare site title)`);
      const overflow = meta.scrollWidth > meta.innerWidth + 1;
      if (overflow) problems.push(`${vp.name} ${path}: horizontal overflow ${meta.scrollWidth} > ${meta.innerWidth}`);
      console.log(`${vp.name.padEnd(7)} ${path.padEnd(42)} title="${meta.title}" cells=${meta.cells} drawer=${meta.drawer} overflow=${overflow ? "YES" : "no"} fonts=${meta.fonts.join("|")}`);
      await tab.close();
    }
  }
} finally {
  await edge.close();
  server?.close();
}
console.log(axeSummary.length ? "\naxe violations (all impacts):\n- " + axeSummary.join("\n- ") : "\naxe: no WCAG 2.x A/AA violations on any page");
if (problems.length) {
  console.log("\nPROBLEMS:\n- " + problems.join("\n- "));
  process.exit(1);
}
console.log("\nscreenshots in design/current/");
