import type { Metadata } from "next";
import { atlas } from "@/lib/data";
import { FrontierList } from "@/components/FrontierList";

export const metadata: Metadata = { title: "Frontier", description: "Known physics, unusual compositions: routes assembled from established relations with no demonstration on record." };

export default function FrontierPage() {
  const a = atlas();
  const c = a.graph.meta.counts;
  const candidates = a.graph.paths.filter((p) => p.frontier_class === "candidate").length;
  return (
    <main>
      <div className="page" style={{ padding: "16px 16px 0" }}>
        <div className="label">Frontier · {candidates} candidate compositions of {c.paths_examined} routes examined</div>
        <h1 className="t-section" style={{ marginTop: 4 }}>
          Known physics, unusual compositions
        </h1>
        <p style={{ maxWidth: "70ch", marginTop: 8 }} className="secondary">
          Each route below is assembled from relations the atlas holds as established or demonstrated. A candidate is one whose complete composition has no demonstration on record — which means only that: no record. The seven glyphs are the physics checks; hover for the basis of each.
        </p>
      </div>
      <FrontierList />
    </main>
  );
}
