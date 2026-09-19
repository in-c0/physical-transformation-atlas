import type { MatrixCellStatus } from "@pta/schema";

/**
 * The matrix marks from DESIGN.md: colour says the epistemic family, geometry
 * says the exact state. Drawn in a 12×12 box and centred by the cell.
 */
export function StatusMark({ status, size = 12 }: { status: MatrixCellStatus; size?: number }) {
  const c = 6;
  let body: React.ReactNode;
  switch (status) {
    case "established":
      body = <rect x={c - 2.5} y={c - 2.5} width={5} height={5} fill="var(--status-established)" />;
      break;
    case "demonstrated":
      body = <circle cx={c} cy={c} r={2.5} fill="var(--status-demonstrated)" />;
      break;
    case "theoretical":
      body = <path d={`M${c} ${c - 3.5} L${c + 3.5} ${c} L${c} ${c + 3.5} L${c - 3.5} ${c} Z`} fill="none" stroke="var(--status-theoretical)" strokeWidth={1} />;
      break;
    case "candidate":
      body = (
        <>
          <rect x={c - 3.5} y={c - 3.5} width={7} height={7} fill="none" stroke="var(--status-candidate)" strokeWidth={1} />
          <rect x={c - 1.5} y={c - 1.5} width={3} height={3} fill="none" stroke="var(--status-candidate)" strokeWidth={1} />
        </>
      );
      break;
    case "searched-none":
      body = <circle cx={c} cy={c} r={3.5} fill="none" stroke="var(--status-searched-none)" strokeWidth={1} />;
      break;
    case "search-incomplete":
      body = <path d={`M${c - 5} ${c + 1} V${c + 5} H${c - 1}`} fill="none" stroke="var(--ink-secondary)" strokeWidth={1} />;
      break;
    case "not-searched":
      body = <path d={`M${c - 5} ${c + 1} V${c + 5} H${c - 1}`} fill="none" stroke="var(--status-not-searched)" strokeWidth={1} />;
      break;
    case "forbidden":
      body = (
        <>
          <circle cx={c} cy={c} r={4} fill="none" stroke="var(--status-forbidden)" strokeWidth={1} />
          <path d={`M${c - 2.8} ${c + 2.8} L${c + 2.8} ${c - 2.8}`} stroke="var(--status-forbidden)" strokeWidth={1} />
        </>
      );
      break;
    case "contradicted":
      body = <path d={`M${c - 4.5} ${c + 4.5} L${c + 4.5} ${c - 4.5}`} stroke="var(--status-contradicted)" strokeWidth={1.2} />;
      break;
    case "insufficient":
      body = (
        <>
          <defs>
            <pattern id="pta-hatch" width={5} height={5} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1={0} y1={0} x2={0} y2={5} stroke="var(--insufficient)" strokeWidth={1} />
            </pattern>
          </defs>
          <rect x={0} y={0} width={12} height={12} fill="url(#pta-hatch)" opacity={0.6} />
        </>
      );
      break;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true" focusable="false" style={{ display: "block" }}>
      {body}
    </svg>
  );
}

export function CheckGlyph({ result }: { result: "pass" | "fail" | "unresolved" | "unknown" }) {
  const glyph = { pass: "✓", fail: "×", unresolved: "?", unknown: "—" }[result];
  return (
    <span className={`check-${result}`} style={{ color: `var(--check-${result})`, fontFamily: "var(--font-mono)" }} aria-hidden="true">
      {glyph}
    </span>
  );
}
