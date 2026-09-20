"use client";
/**
 * Client-side access to the atlas: fetch graph.json and paths.json once, build
 * an AtlasIndex, and share it through a tiny store. Pages render their geometry
 * first and fill evidence in when this resolves ("Loading atlas index…").
 */
import { useEffect, useState } from "react";
import type { CompiledPath, Graph } from "@pta/schema";
import { AtlasIndex } from "@pta/graph/query";

let indexPromise: Promise<AtlasIndex> | undefined;
let resolved: AtlasIndex | undefined;

export function loadAtlas(): Promise<AtlasIndex> {
  if (!indexPromise) {
    indexPromise = (async () => {
      const [g, p] = await Promise.all([
        fetch("/api/graph.json").then((r) => {
          if (!r.ok) throw new Error(`graph.json ${r.status}`);
          // The export envelope is {meta, data}; the graph the index needs is data plus the compiler meta.
          return r.json().then((j: { meta: Graph["meta"]; data: Omit<Graph, "meta" | "paths"> }) => ({ ...j.data, meta: j.meta, paths: [] }) as Graph);
        }),
        fetch("/api/paths.json").then((r) => {
          if (!r.ok) throw new Error(`paths.json ${r.status}`);
          return r.json().then((j: { data: CompiledPath[] }) => j.data);
        }),
      ]);
      g.paths = p;
      resolved = new AtlasIndex(g);
      return resolved;
    })();
    indexPromise.catch(() => {
      indexPromise = undefined;
    });
  }
  return indexPromise;
}

export type AtlasState = { status: "loading" } | { status: "ready"; index: AtlasIndex } | { status: "error"; error: string; retry: () => void };

export function useAtlas(): AtlasState {
  const [state, setState] = useState<AtlasState>(resolved ? { status: "ready", index: resolved } : { status: "loading" });
  useEffect(() => {
    let alive = true;
    const go = () => {
      setState({ status: "loading" });
      loadAtlas().then(
        (index) => alive && setState({ status: "ready", index }),
        (e: Error) => alive && setState({ status: "error", error: e.message, retry: go }),
      );
    };
    if (!resolved) go();
    return () => {
      alive = false;
    };
  }, []);
  return state;
}
