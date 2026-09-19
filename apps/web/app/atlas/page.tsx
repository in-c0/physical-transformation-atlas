import type { Metadata } from "next";
import { Suspense } from "react";
import { AtlasClient } from "./AtlasClient";

export const metadata: Metadata = { title: "Atlas", description: "The semantic network of physical effects and transformations." };

export default function AtlasPage() {
  return (
    <main>
      <Suspense fallback={<div className="page" style={{ padding: 16 }}>Loading atlas index…</div>}>
        <AtlasClient />
      </Suspense>
    </main>
  );
}
