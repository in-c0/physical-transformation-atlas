"use client";
import Link from "next/link";
import type { MatrixAxis } from "@pta/schema";
import type { MatrixCellLite } from "@/lib/data";
import { useAtlas } from "@/lib/client-data";
import { CELL_STATUS_LABEL, EVIDENCE_LABEL, SEARCH_LABEL, hrefFor } from "@/lib/format";
import { Drawer, DrawerSection, drawerStyles as s } from "./Drawer";
import { ClaimLine } from "./ClaimLine";
import { Checksum } from "./Checksum";
import { EvidenceList } from "./EvidenceList";

export function CellDrawer({ row, col, lite, bridgeIdx, onBridge, onClose }: { row: MatrixAxis; col: MatrixAxis; lite: MatrixCellLite; bridgeIdx: number; onBridge: (i: number) => void; onClose: () => void }) {
  const atlas = useAtlas();
  const title = (
    <>
      {row.name} <span className="secondary">×</span> {col.name}
    </>
  );
  const subtitle = `${row.address} × ${col.address} · ${CELL_STATUS_LABEL[lite.status]}`;

  if (atlas.status === "loading") {
    return (
      <Drawer label="Cell" title={title} subtitle={subtitle} onClose={onClose}>
        <DrawerSection title="Direct relation">
          <p className={s.state}>Loading evidence…</p>
          <p className={s.stateSecondary}>Selected coordinate remains visible.</p>
        </DrawerSection>
      </Drawer>
    );
  }
  if (atlas.status === "error") {
    return (
      <Drawer label="Cell" title={title} subtitle={subtitle} onClose={onClose}>
        <DrawerSection title="Direct relation">
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
  const bridges = cell.bridge_paths.map((id) => index.path.get(id)!).filter(Boolean);
  const active = bridges[Math.min(bridgeIdx, Math.max(0, bridges.length - 1))];
  const searches = index.graph.searches.filter((x) => x.target.kind === "cell" && x.target.row === row.id && x.target.col === col.id);
  const rowEntity = index.entity.get(row.id);
  const forbidden = cell.status === "forbidden";

  return (
    <Drawer label="Cell" title={title} subtitle={subtitle} onClose={onClose}>
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
          </>
        )}
        <ol className={s.list}>
          {bridges.map((p, i) => {
            const isActive = active?.id === p.id;
            const searched = p.search_status !== "not-searched";
            const demonstrated = p.search_status === "demonstrated";
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
                  <dt>constituent relations established</dt>
                  <dd>
                    <b>
                      {p.established_steps} / {p.length}
                    </b>
                  </dd>
                  <dt>weakest constituent</dt>
                  <dd>
                    <b className={`ev-${p.evidence_status}`}>{EVIDENCE_LABEL[p.evidence_status]}</b>
                  </dd>
                  <dt>complete composition searched</dt>
                  <dd>
                    <b>{searched ? (p.search_status === "search-incomplete" ? "INDEX ONLY" : "YES") : "NO"}</b>
                  </dd>
                  <dt>direct demonstration found</dt>
                  <dd>
                    <b>{demonstrated ? "YES" : "NONE"}</b>
                  </dd>
                  {p.pathway && (
                    <>
                      <dt>named pathway</dt>
                      <dd>
                        <b>{index.pathway.get(p.pathway)?.name}</b>
                      </dd>
                    </>
                  )}
                </dl>
                <div className={s.bridgeActions}>
                  <Link className={s.linkBtn} href={`/path/${p.id.slice(2)}`}>
                    Open path
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>
      </DrawerSection>

      {active && (
        <DrawerSection title={`Checks · bridge ${String(bridges.indexOf(active) + 1).padStart(2, "0")}`}>
          <Checksum checks={active.checks} claims={active.claims} compact />
        </DrawerSection>
      )}

      <DrawerSection title="Search record" count={searches.length}>
        {searches.length === 0 && (
          <>
            <p className={s.state}>Not searched.</p>
            <p className={s.stateSecondary}>No recorded search for this direct relation.</p>
          </>
        )}
        <ul className={s.list}>
          {searches.map((x) => (
            <li key={x.id} className={s.claim}>
              <div className={s.claimLine}>
                <span className="t-data">{x.date}</span>
                <span className="t-data secondary">{x.engine}</span>
                <span className={s.status}>{x.result.replace(/-/g, " ")}</span>
              </div>
              <div className="t-data secondary">
                {x.works_found} works · {x.query}
              </div>
              {x.top.length > 0 && (
                <ul className={s.conditions}>
                  {x.top.slice(0, 3).map((t) => (
                    <li key={t.title}>
                      {t.doi ? (
                        <a href={`https://doi.org/${t.doi}`} target="_blank" rel="noopener">
                          {t.title}
                        </a>
                      ) : (
                        t.title
                      )}
                      {t.year ? ` (${t.year})` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
        {active && (
          <p className={s.stateSecondary} style={{ marginTop: 8 }}>
            Bridge {String(bridges.indexOf(active) + 1).padStart(2, "0")}: {SEARCH_LABEL[active.search_status]}
            {active.last_searched ? ` · through ${active.last_searched}` : ""}.
          </p>
        )}
      </DrawerSection>

      <DrawerSection title="Evidence" count={index.sourcesFor(direct).length}>
        <EvidenceList sources={index.sourcesFor(direct)} verification={index.graph.source_verification} />
      </DrawerSection>

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
      </DrawerSection>
    </Drawer>
  );
}
