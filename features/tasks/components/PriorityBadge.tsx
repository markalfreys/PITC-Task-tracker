import { cx } from "@/lib/cx";
import { PRIORITY_LABELS } from "../constants";
import type { Priority } from "../types";
import styles from "./PriorityBadge.module.css";

export default function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={cx(styles.badge, styles[priority])}>{PRIORITY_LABELS[priority]}</span>;
}
