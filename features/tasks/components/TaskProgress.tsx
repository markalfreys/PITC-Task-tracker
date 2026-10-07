import styles from "./TaskProgress.module.css";

interface TaskProgressProps {
  completed: number;
  total: number;
}

export default function TaskProgress({ completed, total }: TaskProgressProps) {
  if (total === 0) return null;

  const percent = Math.round((completed / total) * 100);

  return (
    <div className={styles.progress}>
      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Tasks completed"
      >
        <div className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
      <p>
        {completed} of {total} completed ({percent}%)
      </p>
    </div>
  );
}
