import type { Metadata } from "next";
import { atlas } from "@/lib/data";
import { FrontierList } from "@/components/FrontierList";

export const metadata: Metadata = { title: "Frontier", description: "Known physics, unusual compositions: routes assembled from established relations with no demonstration on record." };

export default function FrontierPage() {
  const a = atlas();
  const c = a.graph.meta.counts;
  const candidates = a.graph.paths.filter((p) => p.frontier_class === "candidate" && p.structural_kind === "composition").length;
  const artefacts = a.graph.paths.filter((p) => p.frontier_class === "candidate" && p.structural_kind !== "composition").length;
  const derived = a.graph.paths.filter((p) => p.frontier_class === "derived").length;
  return (
    <main>
      <div className="page" style={{ padding: "16px 16px 0" }}>
        <div className="label">
          Frontier · {candidates} candidate compositions · {artefacts} candidate-class routes that are representation artefacts · {derived} extend a recorded pathway · {c.paths_examined} routes
          examined
        </div>
        <h1 className="t-section" style={{ marginTop: 4 }}>
          Compositions assembled from recorded physical relations
        </h1>
        <p style={{ maxWidth: "72ch", marginTop: 8 }} className="secondary">
          Each route is assembled from relations the atlas holds as established or demonstrated. The default view shows candidate compositions: two or more conversion phenomena with a real handoff,
          whose exact composition has not been assessed and which do not simply extend or truncate a recorded pathway. Routes that are one effect plus bookkeeping, carrier-expanded copies of a shorter
          route, a recorded pathway drawn at another resolution, or an energy round trip are classed by structure and can be shown with the Structure toggles. The order is a fixed research-priority
          order (structure, then resolution of the core physics checks, then unresolved carrier handoffs, then how much a recorded device already implements, then whether any number bounds the route,
          then search state, then evidence floor, then driver availability, then length), never a score. Each row opens with one line for the decision: driver, search state, weakest step, handoff,
          closest recorded mechanism. Neither label says anything about nature — only about what this atlas has recorded.
        </p>
      </div>
      <FrontierList />
    </main>
  );
}
