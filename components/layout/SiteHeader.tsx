import Link from "next/link";
import styles from "./SiteHeader.module.css";

export default function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand}>
          Task Tracker
        </Link>
        <nav className={styles.nav} aria-label="Main">
          <Link href="/">Tasks</Link>
        </nav>
      </div>
    </header>
  );
}
