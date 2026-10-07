import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  title: string;
  description?: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <section className={styles.header}>
      <h1>{title}</h1>
      {description && <p className={styles.description}>{description}</p>}
    </section>
  );
}
