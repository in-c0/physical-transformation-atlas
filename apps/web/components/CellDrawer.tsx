"use client";
import { useState } from "react";
import Link from "next/link";
import type { CompiledPath, MatrixAxis } from "@pta/schema";
import type { AtlasIndex } from "@pta/graph/query";
import type { MatrixCellLite } from "@/lib/data";
import { useAtlas } from "@/lib/client-data";
import { CELL_STATUS_LABEL, CELL_TRANSITION, EVIDENCE_LABEL, STRUCTURE_LABEL, compositionState, hrefFor } from "@/lib/format";
import { Drawer, DrawerSection, drawerStyles as s } from "./Drawer";
import { ClaimLine } from "./ClaimLine";
import { Checksum } from "./Checksum";
import { EvidenceList } from "./EvidenceList";
import { AutomatedRunView, SearchRecordView, searchCompact } from "./SearchRecordView";
import { CORE_CHECK_IDS } from "@pta/physics/definitions";

/** Search terms a reviewer would use: row and column names plus their aliases, quoted. */
function searchDraft(index: AtlasIndex, row: MatrixAxis, col: MatrixAxis): { engine: string; query: string; url: string } {
  const terms = (id: string) => {
    const e = index.entity.get(id);
    const names = [e?.name ?? id, ...(e?.aliases ?? [])].map((x) => x.replace(/\(.*?\)/g, "").trim()).filter((x) => x.length > 3 && /^[A-Za-z0-9 \-–]+$/.test(x));
    return (
      "(" +
      [...new Set(names.map((x) => x.toLowerCase()))]
        .slice(0, 4)
        .map((x) => (x.includes(" ") ? `"${x}"` : x))
        .join(" OR ") +
      ")"
    );
  };
  const query = `${terms(row.id)} AND ${terms(col.id)}`;
  const url = `https://api.openalex.org/works?filter=title_and_abstract.search:${encodeURIComponent(query)}&per-page=25&sort=cited_by_count:desc`;
  return { engine: "openalex", query, url };
}

/** Observed materials per phenomenon of a bridge, from `observed_in` claims. */
function materialsReport(index: AtlasIndex, p: CompiledPath): { phenomenon: string; materials: string[] }[] {
  return p.phenomena.map((ph) => ({
    phenomenon: index.entity.get(ph)?.name ?? ph,
    materials: index
      .claimsFrom(ph)
      .filter((c) => c.predicate === "observed_in" && index.entity.get(c.object)?.type === "material")
      .map((c) => index.entity.get(c.object)?.name ?? c.object),
  }));
}

export function CellDrawer({
  row,
  col,
  lite,
  bridgeIdx,
  onBridge,
  onClose,
}: {
  row: MatrixAxis;
  col: MatrixAxis;
  lite: MatrixCellLite;
  bridgeIdx: number;
  onBridge: (i: number) => void;
  onClose: () => void;
}) {
  const atlas = useAtlas();
  const [copied, setCopied] = useState<string | null>(null);
  const [showMaterials, setShowMaterials] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const title = (
    <>
      {row.name} <span className="secondary">×</span> {col.name}
    </>
  );
  const subtitle = `${row.address} × ${col.address} · ${CELL_STATUS_LABEL[lite.status]}`;
  const question = `Does the atlas record a direct ${col.name.toLowerCase()} relation driven by ${row.name.toLowerCase()}?`;

  if (atlas.status === "loading") {
    return (
      <Drawer label="Cell" title={title} subtitle={subtitle} onClose={onClose}>
        <DrawerSection title="Question">
          <p className={s.state}>{question}</p>
          <p className={s.stateSecondary}>Loading evidence… The selected coordinate remains visible.</p>
        </DrawerSection>
      </Drawer>
    );
  }
  if (atlas.status === "error") {
    return (
      <Drawer label="Cell" title={title} subtitle={subtitle} onClose={onClose}>
        <DrawerSection title="Question">
          <p className={s.state}>
            Evidence could not be loaded for {row.address} × {col.address}.
          </p>
          <p className={s.stateSecondary}>
            {atlas.error}.{" "}
            <button type="button" className={s.linkBtn} onClick={atlas.retry}>
              Retry
            </button>
          </p>
        </DrawerSection>
      </Drawer>
    );
  }

  const index = atlas.index;
  const cell = index.cellFor(row.id, col.id)!;
  const direct = cell.direct_claims.map((id) => index.claim.get(id)!).filter(Boolean);
  const allBridges = cell.bridge_paths.map((id) => index.path.get(id)!).filter(Boolean);
  const bridges = allBridges.filter((p) => p.structural_kind === "composition");
  const excluded = allBridges.length - bridges.length;
  const active = bridges[Math.min(bridgeIdx, Math.max(0, bridges.length - 1))];
  const searches = index.graph.searches.filter((x) => x.target.kind === "cell" && x.target.row === row.id && x.target.col === col.id);
  const runs = (index.graph.search_runs ?? []).filter((x) => x.target.kind === "cell" && x.target.row === row.id && x.target.col === col.id);
  const bridgeConstituent = active ? active.constituent_source_ids.map((id) => index.source.get(id)!).filter(Boolean) : [];
  const bridgeComposition = active ? active.composition_source_ids.map((id) => index.source.get(id)!).filter(Boolean) : [];
  const rowEntity = index.entity.get(row.id);
  const forbidden = cell.status === "forbidden";
  const draft = searchDraft(index, row, col);
  const rev = index.graph.meta.data_hash;

  const copyQuestion = async (format: "md" | "json") => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/matrix?cell=${row.address}:${col.address}` : "";
    const snapshot = {
      url,
      dataset: `r${rev}`,
      coordinate: `${row.address} × ${col.address}`,
      driver: row.name,
      coupling: col.name,
      status: CELL_STATUS_LABEL[cell.status],
      question,
      direct_claims: direct.length,
      qualifying_compositions: bridges.length,
      search: searches.length ? searches.map(searchCompact) : runs.length ? `${runs.length} automated index run(s), not reviewed` : "not searched",
      what_would_change: CELL_TRANSITION[cell.status],
    };
    const md = `**${snapshot.coordinate} · ${snapshot.driver} × ${snapshot.coupling}** — ${snapshot.status} (dataset ${snapshot.dataset})\n\n${snapshot.question}\n\n- direct relations recorded: ${snapshot.direct_claims}\n- qualifying compositions: ${snapshot.qualifying_compositions}\n- search: ${Array.isArray(snapshot.search) ? snapshot.search.join("; ") : snapshot.search}\n- what would change it: ${snapshot.what_would_change}\n\n${url}`;
    try {
      await navigator.clipboard.writeText(format === "md" ? md : JSON.stringify(snapshot, null, 2));
      setCopied(format);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied("failed");
    }
  };

  return (
    <Drawer id="cell-drawer" label="Cell" title={title} subtitle={subtitle} onClose={onClose}>
      <span role="status" aria-live="polite" className="srOnly">
        {copied === "md" ? "Question copied" : copied === "json" ? "JSON copied" : copied === "failed" ? "Clipboard unavailable" : ""}
      </span>
      <DrawerSection title="Question">
        <p className={s.state}>{question}</p>
        <p className={s.stateSecondary} style={{ marginTop: 4 }}>
          <span className="label">What would change this cell</span>
          <br />
          {CELL_TRANSITION[cell.status]}
        </p>
      </DrawerSection>

      <DrawerSection title="Direct relation" count={direct.length}>
        {direct.length === 0 && !forbidden && (
          <>
            <p className={s.state}>No canonical relation currently recorded.</p>
            <p className={s.stateSecondary}>This does not imply the relation is impossible.</p>
          </>
        )}
        {direct.length === 0 && forbidden && (
          <>
            <p className={s.state}>Excluded by a recorded constraint.</p>
            <p className={s.stateSecondary}>
              {rowEntity?.name} carries no exergy relative to the reference environment; the second law forbids a cyclic device drawing work from it. See the constraint claims on{" "}
              <Link href={hrefFor(row.id)}>{rowEntity?.name}</Link>.
            </p>
          </>
        )}
        <div className={s.list}>
          {direct.map((c) => (
            <ClaimLine key={c.id} claim={c} index={index} />
          ))}
        </div>
      </DrawerSection>

      <DrawerSection title="Known bridges" count={bridges.length}>
        {bridges.length === 0 && (
          <>
            <p className={s.state}>No composed pathway currently recorded.</p>
            <p className={s.stateSecondary}>No qualifying bridge is present in the current claim graph.</p>
            <p className={s.stateSecondary} style={{ marginTop: 6 }}>
              <span className="label">Physics screen</span> · Not assessed — no recorded composition is available to run the pathway checks on.
            </p>
          </>
        )}
        {excluded > 0 && (
          <p className={s.stateSecondary} style={{ marginBottom: 6 }}>
            {bridges.length} qualifying composition
            {bridges.length === 1 ? "" : "s"} · {excluded} additional structural route{excluded === 1 ? "" : "s"} (one effect plus bookkeeping, carrier-expanded copies or energy round trips) excluded
            from candidate status; see the frontier&apos;s Structure toggles.
          </p>
        )}
        <ol className={s.list}>
          {bridges.map((p, i) => {
            const isActive = active?.id === p.id;
            const comp = compositionState(p.search_status, p.last_searched);
            const ov = p.known_pathway_overlap;
            const ovName = ov ? index.pathway.get(ov.pathway)?.name : undefined;
            return (
              <li key={p.id} className={`${s.bridge} ${isActive ? s.bridgeActive : ""}`}>
                <button type="button" className={s.bridgeHead} onClick={() => onBridge(i)} aria-pressed={isActive} style={{ width: "100%", textAlign: "left" }}>
                  <span className={s.bridgeNum}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={s.bridgeChain}>
                    {p.nodes.map((n) => (
                      <span key={n}>{index.entity.get(n)?.name ?? n}</span>
                    ))}
                  </span>
                </button>
                <dl className={s.bridgeFacts}>
                  <dt>constituents</dt>
                  <dd>
                    <b>
                      {p.established_steps}/{p.length} established · weakest <span className={`ev-${p.evidence_status}`}>{EVIDENCE_LABEL[p.evidence_status]}</span> · floor {p.constituent_floor}
                    </b>
                  </dd>
                  <dt>exact composition</dt>
                  <dd>
                    <b>{comp.short.toUpperCase()}</b>
                  </dd>
                  {ov && ovName && (
                    <>
                      <dt>{ov.relation === "exact" ? "recorded pathway" : "overlaps"}</dt>
                      <dd>
                        <b>
                          {ovName}
                          {ov.relation !== "exact" ? ` · ${ov.shared_claims}/${ov.route_claims}` : ""}
                        </b>
                      </dd>
                    </>
                  )}
                </dl>
                <div className={s.bridgeActions}>
                  <Link className={s.linkBtn} href={`/path/${p.id.slice(2)}`}>
                    Open path · all 7 checks
                  </Link>
                  <Link className={s.linkBtn} href={`/atlas?route=${p.id}`}>
                    Show in graph
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>
      </DrawerSection>

      {active && (
        <DrawerSection title={`Core checks · bridge ${String(bridges.indexOf(active) + 1).padStart(2, "0")}`}>
          <Checksum checks={active.checks.filter((k) => CORE_CHECK_IDS.has(k.id))} claims={active.claims} compact />
          <button type="button" className={s.linkBtn} style={{ marginTop: 8 }} onClick={() => setShowMaterials(!showMaterials)} aria-expanded={showMaterials} aria-controls="cell-materials-panel">
            {showMaterials ? "Hide" : "Show"} materials & regimes
          </button>
          {showMaterials && (
            <div id="cell-materials-panel" style={{ marginTop: 6 }}>
              {(() => {
                const rep = materialsReport(index, active);
                const withMats = rep.filter((r) => r.materials.length > 0);
                const shared =
                  rep.length >= 2
                    ? rep.slice(1).map((r, i) => ({
                        pair: `${rep[i].phenomenon} → ${r.phenomenon}`,
                        shared: rep[i].materials.filter((m) => r.materials.includes(m)),
                        known: rep[i].materials.length > 0 && r.materials.length > 0,
                      }))
                    : [];
                return (
                  <>
                    <ul className={s.conditions}>
                      {rep.map((r) => (
                        <li key={r.phenomenon}>
                          {r.phenomenon}: {r.materials.length ? `observed in ${r.materials.join(", ")}` : "no material observation recorded"}
                        </li>
                      ))}
                    </ul>
                    {shared.length > 0 && (
                      <ul className={s.conditions} style={{ marginTop: 4 }}>
                        {shared.map((x) => (
                          <li key={x.pair}>
                            {x.pair}: {x.shared.length ? `shared material recorded — ${x.shared.join(", ")}` : x.known ? "no shared material recorded in the atlas" : "insufficient material records"}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className={s.stateSecondary} style={{ marginTop: 4 }}>
                      {active.implied_interface_count} implied interface
                      {active.implied_interface_count === 1 ? "" : "s"} from condition tags. {withMats.length}/{rep.length} phenomena carry material observations. A missing intersection says nothing
                      about compatibility in nature.
                    </p>
                  </>
                );
              })()}
            </div>
          )}
        </DrawerSection>
      )}

      <DrawerSection title="Search record" count={searches.length + runs.length}>
        {searches.length === 0 && runs.length === 0 && (
          <>
            <p className={s.state}>Not searched.</p>
            <p className={s.stateSecondary}>No recorded search for this direct relation.</p>
          </>
        )}
        <div className={s.list}>
          {searches.map((x) => (
            <SearchRecordView key={x.id} record={x} />
          ))}
          {runs.map((x) => (
            <AutomatedRunView key={x.id} run={x} />
          ))}
        </div>
        {active && (
          <p className={s.stateSecondary} style={{ marginTop: 8 }}>
            Bridge {String(bridges.indexOf(active) + 1).padStart(2, "0")}: {compositionState(active.search_status, active.last_searched).long}
          </p>
        )}
        <div className={s.bridgeActions} style={{ marginLeft: 0, marginTop: 8 }}>
          <button type="button" className={s.linkBtn} onClick={() => setShowSearch(!showSearch)} aria-expanded={showSearch} aria-controls="cell-search-panel">
            Prepare search
          </button>
          <button type="button" className={s.linkBtn} onClick={() => copyQuestion("md")}>
            {copied === "md" ? "Copied" : "Copy question"}
          </button>
          <button type="button" className={s.linkBtn} onClick={() => copyQuestion("json")}>
            {copied === "json" ? "Copied" : "Copy JSON"}
          </button>
          {copied === "failed" && <span className="t-micro secondary">clipboard unavailable</span>}
        </div>
        {showSearch && (
          <div id="cell-search-panel" style={{ marginTop: 8 }}>
            <p className={s.stateSecondary}>
              A draft, not a record. Run it, read the hits, and only then add a reviewed entry to <code>data/canonical/searches</code>; automated hits never change a cell&apos;s status.
            </p>
            <p className="t-data" style={{ marginTop: 4, wordBreak: "break-word" }}>
              {draft.engine} · {draft.query}
            </p>
            <p className="t-data" style={{ marginTop: 4 }}>
              <a href={draft.url} target="_blank" rel="noopener" className={s.linkBtn}>
                Run on OpenAlex
              </a>
            </p>
          </div>
        )}
      </DrawerSection>

      {direct.length > 0 && (
        <DrawerSection title="Direct relation evidence" count={index.sourcesFor(direct).length}>
          <EvidenceList sources={index.sourcesFor(direct)} verification={index.graph.source_verification} />
        </DrawerSection>
      )}
      {active && (
        <DrawerSection title={`Selected bridge evidence · bridge ${String(bridges.indexOf(active) + 1).padStart(2, "0")}`} count={bridgeConstituent.length + bridgeComposition.length}>
          <div className="label" style={{ marginBottom: 4 }}>
            for the complete composition · {bridgeComposition.length}
          </div>
          {bridgeComposition.length === 0 ? (
            <p className={s.stateSecondary}>No source on record for this exact composition.</p>
          ) : (
            <EvidenceList sources={bridgeComposition} verification={index.graph.source_verification} />
          )}
          <div className="label" style={{ margin: "10px 0 4px" }}>
            for the constituent relations · {bridgeConstituent.length}
          </div>
          <EvidenceList sources={bridgeConstituent} verification={index.graph.source_verification} />
        </DrawerSection>
      )}

      <DrawerSection title="Coordinates">
        <div className={s.axisLinks}>
          <div>
            <div className="label">{row.address} · driver</div>
            <Link href={hrefFor(row.id)}>{row.name}</Link>
          </div>
          <div>
            <div className="label">{col.address} · coupling</div>
            <Link href={hrefFor(col.id)}>{col.name}</Link>
          </div>
        </div>
        <p className="t-micro secondary" style={{ marginTop: 8 }}>
          dataset r{rev}
          {excluded > 0
            ? ` · ${excluded} route${excluded === 1 ? "" : "s"} classed ${STRUCTURE_LABEL.atomic}, ${STRUCTURE_LABEL["representation-dominated"]} or ${STRUCTURE_LABEL["energy-backtracking"]} are on the frontier under Structure`
            : ""}
        </p>
      </DrawerSection>
    </Drawer>
  );
}
