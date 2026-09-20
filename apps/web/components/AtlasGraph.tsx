"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Core, ElementDefinition } from "cytoscape";
import type { Claim, Entity } from "@pta/schema";
import { PROCESS_PREDICATES } from "@pta/schema";
import { useAtlas } from "@/lib/client-data";
import type { AtlasIndex } from "@pta/graph/query";
import { EVIDENCE_LABEL, FRONTIER_LABEL, hrefFor } from "@/lib/format";
import { Drawer, DrawerSection, drawerStyles as ds } from "./Drawer";
import { ClaimLine } from "./ClaimLine";
import { EvidenceList } from "./EvidenceList";
import { pathTitle } from "./PathView";
import styles from "./AtlasGraph.module.css";

const GRAPH_TYPES: Entity["type"][] = ["disequilibrium", "phenomenon", "carrier", "output", "coupling"];
const EDGE_COLOUR: Record<string, string> = {
  established: "#1b1a18",
  replicated: "#1b1a18",
  demonstrated: "#1f5d87",
  reported: "#1f5d87",
  "theoretically-predicted": "#6a4a86",
  hypothesised: "#6a4a86",
  disputed: "#8a5a16",
  contradicted: "#9c3b31",
  invalid: "#9c3b31",
};

type Selection = { kind: "entity"; id: string } | { kind: "claim"; id: string } | null;

export function AtlasGraph({ initial, route }: { initial?: string; route?: string }) {
  const atlas = useAtlas();
  const host = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [sel, setSel] = useState<Selection>(initial ? { kind: "entity", id: initial } : null);
  const [types, setTypes] = useState<Set<Entity["type"]>>(() => new Set(GRAPH_TYPES.filter((t) => t !== "coupling")));
  const [layoutDone, setLayoutDone] = useState(false);
  const [layoutMode, setLayoutMode] = useState<"layered" | "force">("layered");

  const elements = useMemo<ElementDefinition[] | null>(() => {
    if (atlas.status !== "ready") return null;
    const g = atlas.index.graph;
    // Layered positions: drivers left, phenomena centre (grouped by domain), carriers, outputs right,
    // coupling families in a thin column at the far right. Energy reads left to right.
    // Phenomena fill four sub-columns (column-major, grouped by domain) so the field is about as
    // tall as the driver column and every label has room.
    const COL_X: Record<string, number> = { disequilibrium: 0, carrier: 1180, output: 1420, coupling: 1600 };
    const PHEN_X = [380, 580, 780, 980];
    const STEP = 34;
    const byType = new Map<string, Entity[]>();
    for (const e of g.entities) if (types.has(e.type)) byType.set(e.type, [...(byType.get(e.type) ?? []), e]);
    const pos = new Map<string, { x: number; y: number }>();
    for (const [type, list] of byType) {
      const sorted = [...list].sort((p, q) => (p.domain ?? "").localeCompare(q.domain ?? "") || (p.energy_form ?? "").localeCompare(q.energy_form ?? "") || p.name.localeCompare(q.name));
      if (type === "phenomenon") {
        const rows = Math.ceil(sorted.length / PHEN_X.length);
        const height = (rows - 1) * STEP;
        sorted.forEach((e, i) => pos.set(e.id, { x: PHEN_X[Math.floor(i / rows)], y: (i % rows) * STEP - height / 2 }));
      } else {
        const height = (sorted.length - 1) * STEP;
        sorted.forEach((e, i) => pos.set(e.id, { x: COL_X[type], y: i * STEP - height / 2 }));
      }
    }
    const nodes: ElementDefinition[] = g.entities
      .filter((e) => types.has(e.type))
      .map((e) => ({ data: { id: e.id, label: e.name, type: e.type }, position: pos.get(e.id) }));
    const present = new Set(nodes.map((n) => n.data.id));
    const edges: ElementDefinition[] = g.claims
      .filter((c) => ((PROCESS_PREDICATES as readonly string[]).includes(c.predicate) || c.predicate === "member_of") && present.has(c.subject) && present.has(c.object))
      .map((c) => ({ data: { id: c.id, source: c.subject, target: c.object, predicate: c.predicate, status: c.status } }));
    return [...nodes, ...edges];
  }, [atlas, types]);

  useEffect(() => {
    if (!elements || !host.current) return;
    let cancelled = false;
    let cy: Core | undefined;
    (async () => {
      const cytoscape = (await import("cytoscape")).default;
      if (cancelled || !host.current) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      cy = cytoscape({
        container: host.current,
        elements,
        minZoom: 0.15,
        maxZoom: 3,
        wheelSensitivity: 0.2,
        style: [
          {
            selector: "node",
            style: {
              shape: "ellipse",
              width: 14,
              height: 14,
              "background-color": "#fbf9f4",
              "border-color": "#1b1a18",
              "border-width": 1,
              label: "data(label)",
              "font-family": "IBM Plex Mono, monospace",
              "font-size": 8,
              color: "#1b1a18",
              "text-margin-y": layoutMode === "layered" ? 0 : -3,
              "text-margin-x": layoutMode === "layered" ? 4 : 0,
              "text-valign": layoutMode === "layered" ? "center" : "top",
              "text-halign": layoutMode === "layered" ? "right" : "center",
              "text-wrap": "ellipsis",
              "text-max-width": "110px",
              // Phenomenon and carrier labels appear as you zoom in; drivers and outputs are always named.
              "min-zoomed-font-size": layoutMode === "layered" ? 5 : 8,
              "text-background-color": "#f6f3ec",
              "text-background-opacity": 0.85,
              "text-background-padding": "1px",
            },
          },
          { selector: 'node[type = "disequilibrium"]', style: { shape: "rectangle", width: 16, height: 16, "background-color": "#1b1a18", color: "#1b1a18", "font-size": 10, "font-weight": 500, "min-zoomed-font-size": 5 } },
          { selector: 'node[type = "carrier"]', style: { shape: "diamond", width: 14, height: 14 } },
          { selector: 'node[type = "output"]', style: { shape: "hexagon", width: 20, height: 20, "border-width": 2, "font-size": 10, "font-weight": 500, "min-zoomed-font-size": 5 } },
          { selector: 'node[type = "coupling"]', style: { shape: "round-rectangle", width: 22, height: 12, "border-style": "dashed", color: "#5d5a54" } },
          {
            selector: "edge",
            style: {
              width: 1,
              opacity: 0.6,
              "line-color": "#1b1a18",
              "target-arrow-color": "#1b1a18",
              "target-arrow-shape": "triangle",
              "arrow-scale": 0.6,
              "curve-style": "bezier",
            },
          },
          ...Object.entries(EDGE_COLOUR).map(([status, colour]) => ({ selector: `edge[status = "${status}"]`, style: { "line-color": colour, "target-arrow-color": colour } })),
          { selector: 'edge[status = "theoretically-predicted"], edge[status = "hypothesised"]', style: { "line-style": "dashed" } },
          { selector: 'edge[predicate = "member_of"]', style: { "line-style": "dotted", "line-color": "#d6d0c5", "target-arrow-shape": "none", width: 1 } },
          { selector: ".dim", style: { opacity: 0.12 } },
          { selector: "node.sel", style: { "border-width": 3, "border-color": "#1b1a18", "background-color": "#f6f3ec" } },
          { selector: "edge.sel", style: { width: 2.5 } },
          { selector: "node.route", style: { "border-width": 2, "border-color": "#1b1a18", "background-color": "#fbf9f4", "font-size": 10, "font-weight": 500, "min-zoomed-font-size": 4 } },
          { selector: "edge.route", style: { width: 2.5, opacity: 1 } },
        ],
        layout:
          layoutMode === "layered"
            ? ({ name: "preset", padding: 40, fit: true } as never)
            : ({ name: "cose", animate: false, nodeRepulsion: () => 60000, idealEdgeLength: () => 120, edgeElasticity: () => 60, gravity: 0.08, numIter: 1500, nodeOverlap: 24, padding: 40, randomize: true } as never),
      });
      cyRef.current = cy;
      cy.on("tap", "node", (ev) => setSel({ kind: "entity", id: ev.target.id() }));
      cy.on("tap", "edge", (ev) => setSel({ kind: "claim", id: ev.target.id() }));
      cy.on("tap", (ev) => {
        if (ev.target === cy) setSel(null);
      });
      cy.ready(() => {
        setLayoutDone(true);
        if (route && atlas.status === "ready") {
          const p = atlas.index.path.get(route);
          if (p) {
            const ids = [...p.nodes, ...p.claims];
            let eles = cy!.collection();
            for (const id of ids) eles = eles.union(cy!.getElementById(id));
            cy!.elements().difference(eles).addClass("dim");
            eles.addClass("route");
            cy!.animate({ fit: { eles, padding: 80 } }, { duration: reduce ? 0 : 280, easing: "ease-out-cubic" });
            return;
          }
        }
        if (initial) {
          const n = cy!.getElementById(initial);
          if (n.nonempty()) cy!.animate({ fit: { eles: n.closedNeighborhood(), padding: 60 } }, { duration: reduce ? 0 : 280, easing: "ease-out-cubic" });
        }
      });
    })();
    return () => {
      cancelled = true;
      cy?.destroy();
      cyRef.current = null;
    };
  }, [elements, initial, layoutMode, route]);

  // Highlight the selection's neighbourhood; camera moves only on user selection.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    if (!sel) {
      if (!route) cy.elements().removeClass("dim sel");
      return;
    }
    cy.elements().removeClass("dim sel route");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = cy.getElementById(sel.id);
    if (target.empty()) return;
    const hood = sel.kind === "entity" ? target.closedNeighborhood() : target.union(target.connectedNodes());
    cy.elements().difference(hood).addClass("dim");
    target.addClass("sel");
    cy.animate({ fit: { eles: hood, padding: 80 } }, { duration: reduce ? 0 : 280, easing: "ease-out-cubic" });
  }, [sel, layoutDone, route]);

  const toggleType = (t: Entity["type"]) =>
    setTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  return (
    <div className={`${styles.wrap} ${sel ? styles.withDrawer : ""}`}>
      <div className={styles.main}>
        <div className={styles.toolbar}>
          <span className="label">Show</span>
          {GRAPH_TYPES.map((t) => (
            <button key={t} type="button" className={`${styles.chip} ${types.has(t) ? styles.chipOn : ""}`} aria-pressed={types.has(t) ? "true" : "false"} onClick={() => toggleType(t)}>
              {t}
            </button>
          ))}
          <span className="label" style={{ marginLeft: 8 }}>
            Layout
          </span>
          <button type="button" className={`${styles.chip} ${layoutMode === "layered" ? styles.chipOn : ""}`} aria-pressed={layoutMode === "layered" ? "true" : "false"} onClick={() => setLayoutMode("layered")}>
            layered · drivers → effects → carriers → outputs
          </button>
          <button type="button" className={`${styles.chip} ${layoutMode === "force" ? styles.chipOn : ""}`} aria-pressed={layoutMode === "force" ? "true" : "false"} onClick={() => setLayoutMode("force")}>
            force-directed
          </button>
          <button
            type="button"
            className={styles.chip}
            onClick={() => {
              setSel(null);
              cyRef.current?.animate({ fit: { eles: cyRef.current.elements(), padding: 30 } }, { duration: 280, easing: "ease-out-cubic" });
            }}
          >
            reset view
          </button>
          {route && atlas.status === "ready" && atlas.index.path.get(route) && (
            <span className="t-data" style={{ marginLeft: 8 }}>
              route {route} highlighted · <Link href={`/path/${route.slice(2)}`}>open path</Link>
            </span>
          )}
          <span className={`t-micro secondary ${styles.legend}`}>■ disequilibrium · ● phenomenon · ◆ carrier · ⬢ output · ▭ coupling family · edge colour = evidence status</span>
        </div>
        <div className={styles.canvasWrap}>
          {atlas.status === "loading" && <div className={styles.state}>Loading atlas index…</div>}
          {atlas.status === "error" && (
            <div className={styles.state}>
              Atlas data could not be loaded.{" "}
              <button type="button" className={ds.linkBtn} onClick={atlas.retry}>
                Retry
              </button>
            </div>
          )}
          <div ref={host} className={styles.canvas} role="img" aria-label="Network of disequilibria, phenomena, carriers and outputs linked by process claims" />
        </div>
      </div>
      {sel && atlas.status === "ready" && (sel.kind === "entity" ? <EntityDrawer id={sel.id} index={atlas.index} onClose={() => setSel(null)} onSelect={(id) => setSel({ kind: "entity", id })} /> : <ClaimDrawer id={sel.id} index={atlas.index} onClose={() => setSel(null)} />)}
    </div>
  );
}

function EntityDrawer({ id, index, onClose, onSelect }: { id: string; index: AtlasIndex; onClose: () => void; onSelect: (id: string) => void }) {
  const e = index.entity.get(id);
  if (!e) return null;
  const about = index.claimsAbout(id);
  const process = about.filter((c: Claim) => (PROCESS_PREDICATES as readonly string[]).includes(c.predicate));
  const other = about.filter((c: Claim) => !(PROCESS_PREDICATES as readonly string[]).includes(c.predicate));
  const paths = index.pathsThrough(id);
  const unsearched = paths.filter((p) => p.search_status === "not-searched" && p.frontier_class === "candidate");
  const sources = index.sourcesFor(about);
  const conserve = index.claimsFrom(id).filter((c: Claim) => c.predicate === "bounded_by");
  return (
    <Drawer label={e.type} title={e.name} subtitle={e.symbol ? `${e.symbol} · ${e.id}` : e.id} onClose={onClose}>
      <DrawerSection title="Summary">
        <p className={ds.state}>{e.summary}</p>
        <p className="t-data secondary" style={{ marginTop: 6 }}>
          <Link href={hrefFor(e.id)}>Open full record →</Link>
        </p>
      </DrawerSection>
      <DrawerSection title="Process relations" count={process.length}>
        <div className={ds.list}>
          {process.map((c: Claim) => (
            <div key={c.id}>
              <ClaimLine claim={c} index={index} showConditions={false} />
              <div className={ds.bridgeActions} style={{ marginLeft: 0, marginTop: 0, marginBottom: 4 }}>
                <button type="button" className={ds.linkBtn} onClick={() => onSelect(c.subject === id ? c.object : c.subject)}>
                  focus {index.entity.get(c.subject === id ? c.object : c.subject)?.name}
                </button>
              </div>
            </div>
          ))}
        </div>
      </DrawerSection>
      {conserve.length > 0 && (
        <DrawerSection title="Limiting factors" count={conserve.length}>
          <ul className={ds.conditions}>
            {conserve.map((c: Claim) => (
              <li key={c.id}>
                <Link href={hrefFor(c.object)}>{index.entity.get(c.object)?.name}</Link>
                {index.entity.get(c.object)?.bound ? ` — ${index.entity.get(c.object)?.bound}` : ""}
              </li>
            ))}
          </ul>
        </DrawerSection>
      )}
      <DrawerSection title="Other relations" count={other.length}>
        <div className={ds.list}>
          {other.map((c: Claim) => (
            <ClaimLine key={c.id} claim={c} index={index} showConditions={false} />
          ))}
        </div>
      </DrawerSection>
      <DrawerSection title="Pathways using this" count={paths.length}>
        <ul className={ds.list}>
          {paths.slice(0, 8).map((p) => (
            <li key={p.id} className={ds.claim}>
              <Link href={`/path/${p.id.slice(2)}`} className="t-ui">
                {pathTitle(index, p)}
              </Link>
              <div className="t-micro secondary">
                {p.established_steps}/{p.length} established · {FRONTIER_LABEL[p.frontier_class]}
              </div>
            </li>
          ))}
        </ul>
        <p className="t-data secondary" style={{ marginTop: 6 }}>
          Unsearched candidate compositions through this node: {unsearched.length}
        </p>
      </DrawerSection>
      <DrawerSection title="Evidence" count={sources.length}>
        <EvidenceList sources={sources} verification={index.graph.source_verification} />
      </DrawerSection>
    </Drawer>
  );
}

function ClaimDrawer({ id, index, onClose }: { id: string; index: AtlasIndex; onClose: () => void }) {
  const c = index.claim.get(id);
  if (!c) return null;
  const s = index.entity.get(c.subject);
  const o = index.entity.get(c.object);
  const sources = index.sourcesFor([c]);
  return (
    <Drawer label="Claim" title={`${s?.name} → ${o?.name}`} subtitle={`${c.id} · ${EVIDENCE_LABEL[c.status]}`} onClose={onClose}>
      <DrawerSection title="Relation">
        <ClaimLine claim={c} index={index} />
        {c.energy && (
          <p className="t-data secondary">
            energy {c.energy.input} → {c.energy.output}
            {c.energy.dissipation ? ` · loss to ${c.energy.dissipation}` : ""}
          </p>
        )}
        {c.notes && <p className={ds.stateSecondary}>{c.notes}</p>}
        <p className="t-data secondary">
          reviewed {c.review.last_reviewed}
          {c.review.canonical ? " · canonical" : " · not canonical"}
        </p>
      </DrawerSection>
      <DrawerSection title="Evidence" count={sources.length}>
        <EvidenceList sources={sources} verification={index.graph.source_verification} />
      </DrawerSection>
    </Drawer>
  );
}
