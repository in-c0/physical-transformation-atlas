import Link from "next/link";
import type { AtlasIndex } from "@pta/graph/query";
import styles from "./EntityView.module.css";

/** Condition tags as labels, never as tag ids; the id and description sit in the tooltip. */
export function ConditionTags({ index, tags, prefix }: { index: AtlasIndex; tags: string[]; prefix?: string }) {
  if (tags.length === 0) return null;
  return (
    <div className="t-micro secondary" style={{ marginTop: 8 }}>
      {prefix ? `${prefix} ` : ""}
      {tags.map((t, i) => (
        <span key={t} title={`${t}: ${index.conditionDescription(t) ?? ""}`}>
          {i > 0 && " · "}
          {index.conditionLabel(t)}
        </span>
      ))}
    </div>
  );
}

/** "Explore: relations · matrix context · routes · sources" — one line of section anchors under the header. */
export function Explore({ items }: { items: { label: string; href: string }[] }) {
  return (
    <p className={styles.explore}>
      <span className="label">Explore</span>
      {items.map((it, i) => (
        <span key={it.href}>
          {i > 0 && <span className="secondary"> · </span>}
          <Link href={it.href}>{it.label}</Link>
        </span>
      ))}
    </p>
  );
}

/** Row and column legend for any list of matrix cells. */
export function MatrixLegendLine() {
  return (
    <p className="t-micro secondary" style={{ marginBottom: 6 }}>
      D = disequilibrium row · C = coupling family column. A cell reads the state of the atlas for that pair.
    </p>
  );
}

/** Counts of claims by status as one sentence: "5 established and 1 demonstrated". */
export function statusSentence(statuses: string[], label: (s: string) => string): string {
  const counts = new Map<string, number>();
  for (const s of statuses) counts.set(s, (counts.get(s) ?? 0) + 1);
  const parts = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([s, n]) => `${n} ${label(s).toLowerCase()}`);
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}
