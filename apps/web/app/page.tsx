import { atlas, matrixPayload } from "@/lib/data";
import { LedgerRail, homeReadouts } from "@/components/LedgerRail";
import { Matrix } from "@/components/Matrix";

export default function Home() {
  const a = atlas();
  const c = a.graph.meta.counts;
  const candidates = a.graph.paths.filter((p) => p.frontier_class === "candidate").length;
  return (
    <main>
      <h1 className="visually-hidden" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        Physical Transformation Atlas — recorded and not-yet-searched regions of the current atlas
      </h1>
      <LedgerRail items={homeReadouts({ ...c, candidates })} />
      <Matrix data={matrixPayload()} density="home" fill />
    </main>
  );
}
