import Link from "next/link";
import { cx } from "@/lib/cx";
import type { Task } from "../types";
import PriorityBadge from "./PriorityBadge";
import styles from "./TaskItem.module.css";

interface TaskItemProps {
  task: Task;
  busy: boolean;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export default function TaskItem({ task, busy, onToggle, onDelete }: TaskItemProps) {
  return (
    <li className={cx(styles.item, task.completed && styles.done)}>
      <input
        type="checkbox"
        className={styles.checkbox}
        checked={task.completed}
        disabled={busy}
        onChange={() => onToggle(task)}
        aria-label={`Mark "${task.title}" as ${task.completed ? "not done" : "done"}`}
      />

      <div className={styles.text}>
        <Link href={`/tasks/${encodeURIComponent(task.id)}`} className={styles.title}>
          {task.title}
        </Link>
        {task.description && <p className={styles.description}>{task.description}</p>}
      </div>

      <PriorityBadge priority={task.priority} />

      <button
        type="button"
        className="button ghost danger"
        disabled={busy}
        onClick={() => onDelete(task)}
        aria-label={`Delete "${task.title}"`}
      >
        Delete
      </button>
    </li>
  );
}
