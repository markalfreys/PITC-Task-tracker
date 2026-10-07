"use client";

import { useMemo, useState } from "react";
import { useTasks } from "../client/use-tasks";
import { countTasks, filterTasks } from "../task-filters";
import type { Task, TaskFilter } from "../types";
import FilterBar from "./FilterBar";
import TaskForm from "./TaskForm";
import TaskList from "./TaskList";
import TaskProgress from "./TaskProgress";
import styles from "./TaskBoard.module.css";

interface TaskBoardProps {
  initialTasks: Task[];
}

export default function TaskBoard({ initialTasks }: TaskBoardProps) {
  const { tasks, busyIds, error, dismissError, addTask, toggleTask, deleteTask } =
    useTasks(initialTasks);
  const [filter, setFilter] = useState<TaskFilter>("all");

  const counts = useMemo(() => countTasks(tasks), [tasks]);
  const visibleTasks = useMemo(() => filterTasks(tasks, filter), [tasks, filter]);

  return (
    <div className={styles.board}>
      <TaskForm onAdd={addTask} />

      {error && (
        <div className={styles.error} role="alert">
          <p>{error}</p>
          <button type="button" className="button ghost" onClick={dismissError}>
            Dismiss
          </button>
        </div>
      )}

      <section className="card">
        <div className={styles.header}>
          <h2>Tasks</h2>
          <FilterBar value={filter} counts={counts} onChange={setFilter} />
        </div>

        <TaskList
          tasks={visibleTasks}
          filter={filter}
          busyIds={busyIds}
          onToggle={toggleTask}
          onDelete={deleteTask}
        />

        <TaskProgress completed={counts.completed} total={counts.all} />
      </section>
    </div>
  );
}
