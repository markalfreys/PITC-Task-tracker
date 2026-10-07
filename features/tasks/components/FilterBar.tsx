import { cx } from "@/lib/cx";
import type { TaskFilter } from "../types";
import styles from "./FilterBar.module.css";

const FILTERS: { value: TaskFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

interface FilterBarProps {
  value: TaskFilter;
  counts: Record<TaskFilter, number>;
  onChange: (filter: TaskFilter) => void;
}

export default function FilterBar({ value, counts, onChange }: FilterBarProps) {
  return (
    <div className={styles.bar} role="group" aria-label="Filter tasks">
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          type="button"
          className={cx(styles.filter, value === filter.value && styles.active)}
          aria-pressed={value === filter.value}
          onClick={() => onChange(filter.value)}
        >
          {filter.label} <span className={styles.count}>{counts[filter.value]}</span>
        </button>
      ))}
    </div>
  );
}
