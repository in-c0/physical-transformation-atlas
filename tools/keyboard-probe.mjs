// Keyboard model probe for the matrix (DESIGN.md § Keyboard), run headless.
//   node tools/keyboard-probe.mjs [origin]
import { launchEdge } from "file:///D:/Projects/.tools/edge-session.mjs";
import { startServer } from "./serve-out.mjs";

let origin = process.argv[2];
let server;
if (!origin) {
  server = await startServer(5179);
  origin = "http://127.0.0.1:5179";
}
const edge = await launchEdge({ args: ["--window-size=1440,900"] });
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
};
try {
  const tab = await edge.newTab();
  await tab.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await tab.goto(origin + "/matrix");
  await new Promise((r) => setTimeout(r, 2500));
  const key = async (k, mods = 0) => {
    const codes = {
      ArrowRight: 39,
      ArrowDown: 40,
      ArrowLeft: 37,
      ArrowUp: 38,
      Enter: 13,
      Escape: 27,
      End: 35,
      Home: 36,
    };
    await tab.send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: k,
      code: k,
      windowsVirtualKeyCode: codes[k],
      modifiers: mods,
    });
    await tab.send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: k,
      code: k,
      windowsVirtualKeyCode: codes[k],
      modifiers: mods,
    });
    await new Promise((r) => setTimeout(r, 120));
  };
  const state = async () =>
    JSON.parse(
      await tab.eval(`JSON.stringify({
        active: document.activeElement?.getAttribute('aria-label')?.slice(0, 40) || document.activeElement?.tagName,
        drawer: !!document.querySelector('aside'),
        cell: new URLSearchParams(location.search).get('cell'),
        probe: document.querySelector('[data-probe]')?.textContent?.replace(/\\s+/g,' ').slice(0, 60)
,
        status: document.querySelector('[role=status]')?.textContent?.trim().slice(0, 60),
        lastCol: Array.from(document.querySelectorAll('[role=columnheader]')).at(-1)?.getAttribute('aria-label')?.split(' ')[0],
        lastRow: Array.from(document.querySelectorAll('[role=rowheader]')).at(-1)?.getAttribute('aria-label')?.split(' ')[0]
      })`),
    );
  await tab.eval(`document.querySelector('[role=gridcell][tabindex="0"]').focus()`);
  let s = await state();
  check("first cell focusable", s.active?.startsWith("D.01 × C.01"), s.active);
  await key("ArrowRight");
  await key("ArrowDown");
  s = await state();
  check("arrows move one cell", s.active?.startsWith("D.02 × C.02"), s.active);
  check("probe follows focus", s.probe?.includes("D.02 × C.02"), s.probe);
  await key("End");
  s = await state();
  check("End moves to the last cell of the row", s.active?.startsWith(`D.02 × ${s.lastCol}`), `${s.active} (last col ${s.lastCol})`);
  await key("Home");
  s = await state();
  check("Home moves to the first cell of the row", s.active?.startsWith("D.02 × C.01"), s.active);
  await key("End", 2); // ctrl
  s = await state();
  check("Ctrl+End moves to the last cell of the grid", s.active?.startsWith(`${s.lastRow} × ${s.lastCol}`), `${s.active} (last ${s.lastRow} × ${s.lastCol})`);
  await key("Home", 2);
  s = await state();
  check("Ctrl+Home moves to the first cell of the grid", s.active?.startsWith("D.01 × C.01"), s.active);
  await key("ArrowDown");
  await key("ArrowRight");
  await key("ArrowRight", 2); // ctrl
  s = await state();
  const afterCtrl = s.active;
  check("Ctrl+ArrowRight jumps to the next family", afterCtrl !== "D.02 × C.02", afterCtrl);
  await key("Enter");
  s = await state();
  check("Enter opens the drawer", s.drawer, `cell=${s.cell}`);
  check("opening announces via role=status", (s.status ?? "").includes("opened"), s.status);
  check(
    "drawer is labelled by its h2",
    !!(await tab.eval(
      `(() => { const a = document.querySelector('aside'); const h = a && document.getElementById(a.getAttribute('aria-labelledby') || ''); return h?.tagName === 'H2' && a.id === 'cell-drawer'; })()`,
    )),
    "aside[aria-labelledby] → h2, id=cell-drawer",
  );
  check("URL carries ?cell=", !!s.cell && s.cell.startsWith("D.02:"), s.cell);
  await key("Escape");
  s = await state();
  check("Escape closes the drawer and restores focus", !s.drawer && s.active?.startsWith("D.02"), s.active);
  await tab.close();
} finally {
  await edge.close();
  server?.close();
}
const failed = results.filter((r) => !r.ok);
if (failed.length) {
  console.log(`\n${failed.length} keyboard check(s) failed`);
  process.exit(1);
}
console.log("\nkeyboard model ok");
