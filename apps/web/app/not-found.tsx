import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-narrow" style={{ padding: "48px 16px" }}>
      <div className="label">404</div>
      <h1 className="t-title" style={{ margin: "6px 0 10px" }}>No atlas entry at this address.</h1>
      <p>
        The underlying atlas has not changed. Try the <Link href="/matrix">matrix</Link>, the <Link href="/atlas">atlas</Link> or the search box.
      </p>
    </main>
  );
}
