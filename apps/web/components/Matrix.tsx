"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MatrixPayload, MatrixCellLite } from "@/lib/data";
import { useAtlas } from "@/lib/client-data";
import { useWide } from "@/lib/useWide";
import { CELL_STATUS_SHORT, CELL_STATUS_LABEL } from "@/lib/format";
import { MATRIX_CELL_STATUSES, type MatrixCellStatus } from "@pta/schema";
import { StatusMark } from "./StatusMark";
import { CellDrawer } from "./CellDrawer";
import { Legend } from "./Legend";
import styles from "./Matrix.module.css";

type Pos = { r: number; c: number };

export function Matrix({ data, density, fill = false, filters = false }: { data: MatrixPayload; density: "home" | "full"; fill?: boolean; filters?: boolean }) {
  const { rows, cols } = data;
  const [shown, setShown] = useState<Set<MatrixCellStatus>>(() => new Set(MATRIX_CELL_STATUSES));
  const filtersOpen = useWide();
  const toggleStatus = (s: MatrixCellStatus) =>
    setShown((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  const cellAt = useMemo(() => {
    const m = new Map<string, MatrixCellLite>();
    for (const c of data.cells) m.set(`${c.row}|${c.col}`, c);
    return m;
  }, [data]);
  const cell = useCallback((r: number, c: number) => cellAt.get(`${rows[r].id}|${cols[c].id}`)!, [cellAt, rows, cols]);

  const [focus, setFocus] = useState<Pos>({ r: 0, c: 0 });
  const [hover, setHover] = useState<Pos | null>(null);
  const [selected, setSelected] = useState<Pos | null>(null);
  const [bridgeIdx, setBridgeIdx] = useState(0);
  const cellRefs = useRef(new Map<string, HTMLButtonElement>());
  const gridRef = useRef<HTMLDivElement>(null);
  const atlas = useAtlas();

  // ?cell=D.04:C.11 — a scientific question is a link.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("cell");
    if (!q) return;
    const [ra, ca] = q.split(":");
    const r = rows.findIndex((x) => x.address === ra);
    const c = cols.findIndex((x) => x.address === ca);
    if (r >= 0 && c >= 0) {
      setFocus({ r, c });
      setSelected({ r, c });
    }
  }, [rows, cols]);

  const select = useCallback(
    (p: Pos | null) => {
      setSelected(p);
      setBridgeIdx(0);
      const url = new URL(window.location.href);
      if (p) url.searchParams.set("cell", `${rows[p.r].address}:${cols[p.c].address}`);
      else url.searchParams.delete("cell");
      window.history.replaceState(null, "", url.toString());
    },
    [rows, cols],
  );

  const focusCell = useCallback((p: Pos) => {
    setFocus(p);
    const el = cellRefs.current.get(`${p.r}|${p.c}`);
    el?.focus({ preventScroll: false });
  }, []);

  const familyEdge = (i: number, axis: { family: string }[], dir: 1 | -1): number => {
    const fam = axis[i].family;
    if (dir === 1) {
      let j = i;
      while (j < axis.length && axis[j].family === fam) j++;
      return Math.min(j, axis.length - 1);
    }
    let j = i;
    while (j > 0 && axis[j - 1].family === fam) j--;
    if (j === i && i > 0) {
      const prev = axis[i - 1].family;
      j = i - 1;
      while (j > 0 && axis[j - 1].family === prev) j--;
    }
    return j;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const { r, c } = focus;
    const mod = e.ctrlKey || e.metaKey;
    let next: Pos | null = null;
    switch (e.key) {
      case "ArrowRight":
        next = {
          r,
          c: mod ? familyEdge(c, cols, 1) : Math.min(c + 1, cols.length - 1),
        };
        break;
      case "ArrowLeft":
        next = { r, c: mod ? familyEdge(c, cols, -1) : Math.max(c - 1, 0) };
        break;
      case "ArrowDown":
        next = {
          r: mod ? familyEdge(r, rows, 1) : Math.min(r + 1, rows.length - 1),
          c,
        };
        break;
      case "ArrowUp":
        next = { r: mod ? familyEdge(r, rows, -1) : Math.max(r - 1, 0), c };
        break;
      case "Home":
        // grid convention: Home = first cell in the row, Ctrl/⌘+Home = first cell of the grid
        next = mod ? { r: 0, c: 0 } : { r, c: 0 };
        break;
      case "End":
        next = mod ? { r: rows.length - 1, c: cols.length - 1 } : { r, c: cols.length - 1 };
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        select({ r, c });
        return;
      case "Escape":
        if (selected) {
          e.preventDefault();
          select(null);
          focusCell(focus);
        }
        return;
      default:
        return;
    }
    e.preventDefault();
    if (next) focusCell(next);
  };

  // Waypoints of the known bridges for the selected cell (the "coordinate trace").
  const waypoints = useMemo(() => {
    const map = new Map<string, number[]>();
    if (!selected || atlas.status !== "ready") return map;
    const index = atlas.index;
    const full = index.cellFor(rows[selected.r].id, cols[selected.c].id);
    if (!full) return map;
    full.bridge_paths.forEach((pid, k) => {
      const p = index.path.get(pid);
      if (!p) return;
      for (const node of p.nodes) {
        const ent = index.entity.get(node);
        if (ent?.type !== "phenomenon") continue;
        for (const fam of index.families(node)) {
          const key = `${p.source}|${fam}`;
          if (key === `${rows[selected.r].id}|${cols[selected.c].id}`) continue;
          const list = map.get(key) ?? [];
          if (!list.includes(k + 1)) list.push(k + 1);
          map.set(key, list);
        }
      }
    });
    return map;
  }, [selected, atlas, rows, cols]);

  const probe = hover ?? focus;
  const probeCell = cell(probe.r, probe.c);
  const activeRow = selected?.r ?? focus.r;
  const activeCol = selected?.c ?? focus.c;

  // Column family bands.
  const colBands = useMemo(() => {
    const bands: { family: string; start: number; span: number }[] = [];
    cols.forEach((col, i) => {
      const last = bands[bands.length - 1];
      if (last && last.family === col.family) last.span++;
      else bands.push({ family: col.family, start: i, span: 1 });
    });
    return bands;
  }, [cols]);

  // Home density fills the available width between 24×20 and 40×32; /matrix is fixed at 40×32.
  const cellW = density === "home" ? "clamp(var(--matrix-cell-home-w), calc((100vw - var(--matrix-row-axis) - 2 * var(--gutter) - 12px) / var(--cols)), var(--matrix-cell-w))" : "var(--matrix-cell-w)";
  const cellH =
    density === "home" ? "clamp(var(--matrix-cell-home-h), calc(0.8 * (100vw - var(--matrix-row-axis) - 2 * var(--gutter) - 12px) / var(--cols)), var(--matrix-cell-h))" : "var(--matrix-cell-h)";

  return (
    <div className={`${styles.wrap} ${selected ? styles.withDrawer : ""} ${fill ? styles.fill : ""}`}>
      <div className={styles.main}>
        {filters && (
          <details className={styles.filterToggle} open>
            <summary>Show cell states</summary>
            <div className={styles.filters} role="group" aria-label="Show cells with status">
              <span className="label">Show</span>
              {MATRIX_CELL_STATUSES.map((s) => (
                <button key={s} type="button" className={`${styles.filter} ${shown.has(s) ? styles.filterOn : ""}`} aria-pressed={shown.has(s)} onClick={() => toggleStatus(s)}>
                  <StatusMark status={s} />
                  <span>{CELL_STATUS_LABEL[s]}</span>
                </button>
              ))}
              <button type="button" className={styles.filterReset} onClick={() => setShown(new Set(MATRIX_CELL_STATUSES))}>
                all
              </button>
            </div>
          </details>
        )}
        <div className={styles.probe} data-probe>
          <span className={styles.probeLabel}>PROBE</span>
          <span className={`address active ${styles.probeAddr}`}>
            {rows[probe.r].address} × {cols[probe.c].address}
          </span>
          <span className={styles.probeNames}>
            {rows[probe.r].name.toUpperCase()} → {cols[probe.c].name.toUpperCase()}
          </span>
          <span className={`${styles.probeStatus} st-${probeCell.status}`}>{CELL_STATUS_SHORT[probeCell.status]}</span>
        </div>
        <div className={styles.scroller}>
          <div
            ref={gridRef}
            role="grid"
            aria-label="Disequilibrium by coupling family matrix"
            aria-rowcount={rows.length + 1}
            aria-colcount={cols.length + 1}
            className={styles.grid}
            style={{
              ["--cols" as string]: cols.length,
              ["--cell-w" as string]: cellW,
              ["--cell-h" as string]: cellH,
            }}
            onKeyDown={onKeyDown}
          >
            {/* Header row: corner + family bands + column headers. display:contents keeps them direct
                grid children for layout while the a11y tree sees one row (axe aria-required-children). */}
            <div role="row" aria-rowindex={1} className={styles.row}>
              <div className={styles.corner} role="columnheader" aria-label="Driver rows by coupling columns">
                <span className="t-micro">DRIVER ↓ D.</span>
                <span className="t-micro">COUPLING → C.</span>
              </div>
              <div className={styles.bands} aria-hidden="true">
                {colBands.map((b) => (
                  <div key={b.start} className={styles.band} style={{ gridColumn: `span ${b.span}` }} title={b.family.replace(/-/g, " ")}>
                    {(density === "full" ? b.span >= 2 : b.span >= 3) && <span>{b.family.replace(/-/g, " ")}</span>}
                  </div>
                ))}
              </div>
              <div className={styles.colHeads} role="presentation">
                {cols.map((col, c) => (
                  <div
                    key={col.id}
                    role="columnheader"
                    className={`${styles.colHead} ${c === activeCol ? styles.colHeadActive : ""} ${c > 0 && cols[c - 1].family !== col.family ? styles.familyStartCol : ""}`}
                    title={col.name}
                    aria-label={`${col.address} ${col.name}, ${col.family.replace(/-/g, " ")} family`}
                  >
                    <span className={`address ${c === activeCol ? "active" : ""}`}>{density === "home" ? col.address.slice(2) : col.address}</span>
                  </div>
                ))}
              </div>
            </div>
            {rows.map((row, r) => (
              <div role="row" key={row.id} className={styles.row} aria-rowindex={r + 2}>
                <div
                  role="rowheader"
                  className={`${styles.rowHead} ${r === activeRow ? styles.rowHeadActive : ""} ${r > 0 && rows[r - 1].family !== row.family ? styles.familyStartRow : ""}`}
                  aria-label={`${row.address} ${row.name}`}
                >
                  <span className={`address ${r === activeRow ? "active" : ""}`}>{row.address}</span>
                  <span className={styles.rowName}>{row.name}</span>
                </div>
                {cols.map((col, c) => {
                  const cl = cell(r, c);
                  const key = `${r}|${c}`;
                  const isFocus = focus.r === r && focus.c === c;
                  const isSel = selected?.r === r && selected?.c === c;
                  const wp = waypoints.get(`${row.id}|${col.id}`);
                  const cls = [
                    styles.cell,
                    r === activeRow ? styles.guideRow : "",
                    c === activeCol ? styles.guideCol : "",
                    isSel ? styles.selected : "",
                    c > 0 && cols[c - 1].family !== col.family ? styles.familyStartCol : "",
                    r > 0 && rows[r - 1].family !== row.family ? styles.familyStartRow : "",
                    cl.status === "insufficient" ? "hatch" : "",
                    shown.has(cl.status) ? "" : styles.dimmed,
                  ].join(" ");
                  return (
                    <button
                      key={col.id}
                      type="button"
                      role="gridcell"
                      aria-colindex={c + 2}
                      aria-selected={isSel}
                      aria-expanded={isSel}
                      aria-controls={isSel ? "cell-drawer" : undefined}
                      aria-label={`${row.address} × ${col.address}, ${row.name} by ${col.name}: ${CELL_STATUS_LABEL[cl.status]}${cl.direct ? `, ${cl.direct} direct relation${cl.direct > 1 ? "s" : ""}` : ""}${cl.bridges ? `, ${cl.bridges} bridge path${cl.bridges > 1 ? "s" : ""}` : ""}`}
                      tabIndex={isFocus ? 0 : -1}
                      className={cls}
                      ref={(el) => {
                        if (el) cellRefs.current.set(key, el);
                        else cellRefs.current.delete(key);
                      }}
                      onFocus={() => setFocus({ r, c })}
                      onMouseEnter={() => setHover({ r, c })}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => {
                        setFocus({ r, c });
                        select({ r, c });
                      }}
                    >
                      <StatusMark status={cl.status} />
                      {wp && <span className={styles.waypoint}>{wp.join("")}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className={styles.rail}>
          <Legend compact />
          <span className={`t-micro ${styles.stamp}`}>
            {data.searches_index_only} INDEX-ONLY CELL SEARCH{data.searches_index_only === 1 ? "" : "ES"} · {data.searches_reviewed} REVIEWED SEARCH{data.searches_reviewed === 1 ? "" : "ES"} ·{" "}
            {data.indexed_through ? `SEARCH RECORDS THROUGH ${data.indexed_through}` : "NO SEARCH RECORDS"} · DATASET r{data.data_hash}
          </span>
        </div>
      </div>
      <span role="status" aria-live="polite" className="srOnly">
        {selected ? `Cell ${rows[selected.r].address} × ${cols[selected.c].address} opened` : ""}
      </span>
      {selected && (
        <CellDrawer
          row={rows[selected.r]}
          col={cols[selected.c]}
          lite={cell(selected.r, selected.c)}
          bridgeIdx={bridgeIdx}
          onBridge={setBridgeIdx}
          onClose={() => {
            select(null);
            focusCell(focus);
          }}
        />
      )}
    </div>
  );
}
