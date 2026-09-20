// WCAG contrast of every text colour token against the surface. Run: node tools/contrast.mjs
const surface = "#f6f3ec";
const tokens = {
  ink: "#1b1a18",
  "ink-secondary": "#5d5a54",
  demonstrated: "#1f5d87",
  theoretical: "#6a4a86",
  "searched-none / unresolved": "#8a5a16",
  contradicted: "#9c3b31",
  insufficient: "#66635d",
  "not-searched mark": "#bdb8ae",
  hairline: "#d6d0c5",
};
const lin = (c) => {
  const v = parseInt(c, 16) / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const L = (hex) => {
  const h = hex.replace("#", "");
  return 0.2126 * lin(h.slice(0, 2)) + 0.7152 * lin(h.slice(2, 4)) + 0.0722 * lin(h.slice(4, 6));
};
const ratio = (a, b) => {
  const [x, y] = [L(a), L(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
let bad = 0;
for (const [name, hex] of Object.entries(tokens)) {
  const r = ratio(hex, surface);
  const textOk = r >= 4.5;
  const smallOk = r >= 7;
  console.log(`${name.padEnd(28)} ${hex}  ${r.toFixed(2)}:1  ${textOk ? "AA text" : "fill only"}${smallOk ? " · AAA" : ""}`);
  if (!textOk && !/mark|hairline/.test(name)) bad++;
}
process.exit(bad ? 1 : 0);
