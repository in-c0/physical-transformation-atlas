"use client";
import { useEffect, useId, useRef } from "react";
import styles from "./Drawer.module.css";

export function Drawer({
  id,
  label,
  title,
  subtitle,
  onClose,
  children,
}: {
  id?: string;
  label: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const titleId = useId();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const el = ref.current;
    el?.addEventListener("keydown", onKey);
    return () => el?.removeEventListener("keydown", onKey);
  }, [onClose]);
  // On a phone the sheet covers the page; a tap outside it closes it (the scrim is inert on wider screens).
  return (
    <>
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />
      <aside ref={ref} id={id} className={styles.drawer} aria-labelledby={titleId} role="dialog" aria-modal="false">
        <div className={styles.head}>
          <div className={styles.title}>
            <div className="label">{label}</div>
            <h2 id={titleId} className="t-sub">
              {title}
            </h2>
            {subtitle && <div className="t-data secondary">{subtitle}</div>}
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label={`Close ${label.toLowerCase()} drawer`}>
            ESC
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </aside>
    </>
  );
}

export function DrawerSection({ title, count, children }: { title: string; count?: number | string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h3 className="label">{title}</h3>
        {count !== undefined && <span className={styles.count}>{String(count).padStart(2, "0")}</span>}
      </div>
      {children}
    </section>
  );
}

export const drawerStyles = styles;
