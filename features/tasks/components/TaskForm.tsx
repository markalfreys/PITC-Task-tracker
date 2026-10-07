import { useState, type FormEvent } from "react";
import {
  DESCRIPTION_MAX_LENGTH,
  PRIORITIES,
  PRIORITY_LABELS,
  TITLE_MAX_LENGTH,
} from "../constants";
import type { NewTaskInput, Priority } from "../types";
import { isPriority } from "../validation";
import styles from "./TaskForm.module.css";

interface TaskFormProps {
  onAdd: (input: NewTaskInput) => Promise<boolean>; // true if saved
}

export default function TaskForm({ onAdd }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || title.trim() === "") return;

    setSubmitting(true);
    try {
      const saved = await onAdd({ title, description, priority });
      if (saved) {
        setTitle("");
        setDescription("");
        setPriority("medium");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={`card ${styles.form}`} onSubmit={handleSubmit}>
      <h2>New task</h2>

      <label htmlFor="task-title" className={styles.label}>
        Title
      </label>
      <input
        id="task-title"
        className={styles.field}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to be done?"
        maxLength={TITLE_MAX_LENGTH}
        required
      />

      <label htmlFor="task-description" className={styles.label}>
        Description (optional)
      </label>
      <textarea
        id="task-description"
        className={styles.field}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add some details"
        maxLength={DESCRIPTION_MAX_LENGTH}
        rows={2}
      />

      <div className={styles.row}>
        <div className={styles.priority}>
          <label htmlFor="task-priority" className={styles.label}>
            Priority
          </label>
          <select
            id="task-priority"
            className={styles.field}
            value={priority}
            onChange={(e) => {
              if (isPriority(e.target.value)) setPriority(e.target.value);
            }}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="button primary" disabled={submitting}>
          {submitting ? "Adding…" : "Add task"}
        </button>
      </div>
    </form>
  );
}
