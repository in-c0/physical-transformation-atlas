"use client";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchHit } from "@pta/graph/query";
import { loadAtlas } from "@/lib/client-data";
import styles from "./Search.module.css";

export function Search() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!q.trim()) {
      setHits([]);
      return;
    }
    let alive = true;
    if (state === "idle") setState("loading");
    loadAtlas().then(
      (index) => {
        if (!alive) return;
        setState("ready");
        setHits(index.search(q, 12));
        setActive(0);
      },
      () => alive && setState("error"),
    );
    return () => {
      alive = false;
    };
  }, [q, state]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const go = (h: SearchHit) => {
    setOpen(false);
    setQ("");
    router.push(h.href);
  };

  return (
    <div className={styles.box} ref={box} role="search">
      <input
        className={styles.input}
        type="search"
        value={q}
        placeholder="Search a concept — rain, strain, ΔT…"
        aria-label="Search the atlas"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open && hits.length > 0}
        aria-controls={listId}
        aria-activedescendant={open && hits[active] ? `${listId}-${active}` : undefined}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, hits.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && hits[active]) {
            e.preventDefault();
            go(hits[active]);
          } else if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && q.trim() && (
        <ul id={listId} className={styles.results} role="listbox" aria-label="Search results">
          {state === "loading" && <li className={`${styles.note} t-data`}>Loading atlas index…</li>}
          {state === "error" && <li className={`${styles.note} t-data`}>Atlas data could not be loaded.</li>}
          {state === "ready" && hits.length === 0 && (
            <li className={`${styles.note} t-data`}>No indexed entity or named pathway matches “{q.trim()}”. Try a physical driver, effect, coupling or device name.</li>
          )}
          {hits.map((h, i) => (
            <li key={h.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
              <button type="button" className={`${styles.hit} ${i === active ? styles.hitActive : ""}`} onMouseEnter={() => setActive(i)} onClick={() => go(h)}>
                <span className="label">{h.type}</span>
                <span className={styles.hitName}>{h.name}</span>
                {h.kind === "entity" && h.entity.symbol && <span className="t-data secondary">{h.entity.symbol}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
