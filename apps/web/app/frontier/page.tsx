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
  const incomplete = a.graph.paths.filter((p) => p.frontier_class === "incomplete-handoff").length;
  return (
    <main>
      <div className="page" style={{ padding: "16px 16px 0" }}>
        <div className="label">
          Frontier · {candidates} candidate compositions · {artefacts} candidate-class routes that are representation artefacts · {derived} extend a recorded pathway · {incomplete} with an unresolved
          handoff · {c.paths_examined} routes examined
        </div>
        <h1 className="t-section" style={{ marginTop: 4 }}>
          Compositions assembled from recorded physical relations
        </h1>
        <p style={{ maxWidth: "72ch", marginTop: 8 }} className="secondary">
          Default: candidate compositions assembled from recorded established or demonstrated relations whose exact composition has not been assessed. Rows follow the atlas's recorded
          research-priority order; this reports the atlas, not nature.
        </p>
        <details className="leadMore">
          <summary className="label">How routes are classed and ordered</summary>
          <p style={{ maxWidth: "72ch", marginTop: 8 }} className="secondary">
            Each route is assembled from relations the atlas holds as established or demonstrated. A route whose consuming step declares a carrier requirement that nothing upstream provides is classed
            “unresolved handoff” rather than candidate until the interface is recorded. Routes that are one effect plus bookkeeping, carrier-expanded copies of a shorter route (including a rotor or
            other relay inserted into a mechanism the atlas records directly), a recorded pathway drawn at another resolution, a preparation of an ambient driver for a recorded composition, or a
            route whose source and sink carry the same energy form (same-form: a statement about the two ends, not a round trip) are classed by structure or by that class and can be shown with the toggles. The order is structure, then resolution of the core physics checks, then unresolved carrier
            handoffs, then how much a recorded device already implements, then whether any number bounds the route, then search state, then evidence floor, then driver availability, then length. Each
            row opens with one line for the decision: driver, search state, weakest step, handoff, closest recorded mechanism.
          </p>
        </details>
      </div>
      <FrontierList />
    </main>
  );
}
