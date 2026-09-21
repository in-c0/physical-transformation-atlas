import type { Metadata } from "next";
import Link from "next/link";
import { atlas } from "@/lib/data";
import { SYSTEM_STATUS_LABEL } from "@/lib/format";

export const metadata: Metadata = { title: "Systems", description: "Multi-route systems: linear pathways joined by documented handoffs — a topping cycle's exhaust heat sourcing a bottoming cycle." };

/** The system layer's index (pass 34): every recorded system, its members and the status of its weakest handoff. */
export default function SystemsPage() {
  const index = atlas();
  const systems = index.graph.systems;
  return (
    <main>
      <div className="page" style={{ padding: "16px 16px 0" }}>
        <div className="label">Systems · {systems.length} recorded</div>
        <h1 className="t-section" style={{ marginTop: 4 }}>
          Linear pathways joined by documented handoffs
        </h1>
        <p style={{ maxWidth: "72ch", marginTop: 8 }} className="secondary">
          A route and a pathway are one linear causal chain from one source to one output, and stay so. A system joins two or more of them through a residual stream — a gas turbine&apos;s exhaust heat
          sourcing a steam cycle — that no linear route can express. Each member keeps its own route and its eight checks; the system records the handoff, the outputs and its own performance, and is
          never run through the checks itself. Systems are not part of the candidate frontier.
        </p>
        <ol style={{ marginTop: 16, paddingLeft: 0, listStyle: "none" }}>
          {systems.map((s) => (
            <li key={s.id} style={{ padding: "12px 0", borderTop: "var(--border)" }}>
              <div className="label">
                {SYSTEM_STATUS_LABEL[s.status]} · {s.members.length} members · {s.handoffs.length} handoff{s.handoffs.length === 1 ? "" : "s"} ({s.handoff_status})
              </div>
              <Link href={`/system/${s.id.split(":")[1]}`} className="t-body" style={{ fontWeight: 500 }}>
                {s.name}
              </Link>
              <p className="secondary t-ui" style={{ marginTop: 4, maxWidth: "72ch", fontWeight: 400 }}>
                {s.members.map((m) => `${m.pathway_name} (${m.role})`).join(" · ")}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
