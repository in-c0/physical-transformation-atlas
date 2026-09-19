"use client";
import { useEffect, useRef } from "react";
import styles from "./Drawer.module.css";

export function Drawer({ label, title, subtitle, onClose, children }: { label: string; title: React.ReactNode; subtitle?: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const el = ref.current;
    el?.addEventListener("keydown", onKey);
    return () => el?.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <aside ref={ref} className={styles.drawer} aria-label={label}>
      <div className={styles.head}>
        <div className={styles.title}>
          <div className="label">{label}</div>
          <div className="t-sub">{title}</div>
          {subtitle && <div className="t-data secondary">{subtitle}</div>}
        </div>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close evidence drawer">
          ESC
        </button>
      </div>
      <div className={styles.body}>{children}</div>
    </aside>
  );
}

export function DrawerSection({ title, count, children }: { title: string; count?: number | string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <span className="label">{title}</span>
        {count !== undefined && <span className={styles.count}>{String(count).padStart(2, "0")}</span>}
      </div>
      {children}
    </section>
  );
}

export const drawerStyles = styles;
