import { cx } from "@/lib/cx";
import type { Task } from "../types";
import PriorityBadge from "./PriorityBadge";
import styles from "./TaskDetails.module.css";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export default function TaskDetails({ task }: { task: Task }) {
  return (
    <article className={cx("card", styles.details)}>
      <div className={styles.header}>
        <h1>{task.title}</h1>
        <PriorityBadge priority={task.priority} />
      </div>

      <p className={cx(styles.description, !task.description && "muted")}>
        {task.description || "No description."}
      </p>

      <dl className={styles.facts}>
        <dt>Status</dt>
        <dd className={task.completed ? styles.done : styles.open}>
          {task.completed ? "Completed" : "Active"}
        </dd>

        <dt>Created</dt>
        <dd>{dateFormat.format(new Date(task.createdAt))} UTC</dd>

        <dt>ID</dt>
        <dd>
          <code>{task.id}</code>
        </dd>
      </dl>
    </article>
  );
}
