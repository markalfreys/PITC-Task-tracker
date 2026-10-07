import type { ReactNode } from "react";
import styles from "./MessageCard.module.css";

interface MessageCardProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

export default function MessageCard({ title, children, actions }: MessageCardProps) {
  return (
    <section className={`card ${styles.card}`}>
      <h1>{title}</h1>
      <div className={styles.body}>{children}</div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </section>
  );
}
