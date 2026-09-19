"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Header.module.css";
import { Search } from "./Search";

const NAV = [
  ["/atlas", "Atlas"],
  ["/matrix", "Matrix"],
  ["/frontier", "Frontier"],
  ["/coverage", "Coverage"],
  ["/methods", "Methods"],
] as const;

export function Header() {
  const path = usePathname();
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="Physical Transformation Atlas, home">
        <span className={styles.brandLong}>Physical Transformation Atlas</span>
        <span className={styles.brandShort}>PTA</span>
      </Link>
      <nav className={styles.nav} aria-label="Primary">
        {NAV.map(([href, label]) => (
          <Link key={href} href={href} className={styles.navItem} aria-current={path === href || path.startsWith(href + "/") ? "page" : undefined}>
            {label}
          </Link>
        ))}
      </nav>
      <Search />
    </header>
  );
}
