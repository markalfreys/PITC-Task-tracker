import type { Task, TaskFilter } from "../types";
import TaskItem from "./TaskItem";
import styles from "./TaskList.module.css";

const EMPTY_MESSAGES: Record<TaskFilter, string> = {
  all: "No tasks yet. Add one above.",
  active: "Nothing left to do. Nice work!",
  completed: "No completed tasks yet.",
};

interface TaskListProps {
  tasks: Task[];
  filter: TaskFilter;
  busyIds: ReadonlySet<string>;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export default function TaskList({ tasks, filter, busyIds, onToggle, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return <p className={styles.empty}>{EMPTY_MESSAGES[filter]}</p>;
  }

  return (
    <ul className={styles.list}>
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          busy={busyIds.has(task.id)}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
