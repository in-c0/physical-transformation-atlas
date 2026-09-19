import type { Metadata } from "next";
import { atlas } from "@/lib/data";
import { FrontierList } from "@/components/FrontierList";

export const metadata: Metadata = { title: "Frontier", description: "Known physics, unusual compositions: routes assembled from established relations with no demonstration on record." };

export default function FrontierPage() {
  const a = atlas();
  const c = a.graph.meta.counts;
  const candidates = a.graph.paths.filter((p) => p.frontier_class === "candidate").length;
  const derived = a.graph.paths.filter((p) => p.frontier_class === "derived").length;
  return (
    <main>
      <div className="page" style={{ padding: "16px 16px 0" }}>
        <div className="label">
          Frontier · {candidates} candidate compositions · {derived} extend a recorded pathway · {c.paths_examined} routes examined
        </div>
        <h1 className="t-section" style={{ marginTop: 4 }}>
          Compositions assembled from recorded physical relations
        </h1>
        <p style={{ maxWidth: "72ch", marginTop: 8 }} className="secondary">
          Each route is assembled from relations the atlas holds as established or demonstrated. A candidate is a route whose exact composition has not been assessed and which does not simply extend or truncate a recorded pathway; routes that do are listed separately as derived. Neither label says anything about nature — only about what this atlas has and has not recorded. The seven glyphs are the physics checks; hover for the basis of each.
        </p>
      </div>
      <FrontierList />
    </main>
  );
}
