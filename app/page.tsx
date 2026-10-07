import { Suspense } from "react";
import { connection } from "next/server";
import PageHeader from "@/components/layout/PageHeader";
import TaskBoard from "@/features/tasks/components/TaskBoard";
import { taskService } from "@/features/tasks/server";

export default function HomePage() {
  return (
    <>
      <PageHeader
        title="My tasks"
        description="Add tasks, tick them off when they're done and filter the list."
      />

      <Suspense fallback={<p className="muted">Loading tasks…</p>}>
        <TaskBoardLoader />
      </Suspense>
    </>
  );
}

async function TaskBoardLoader() {
  await connection(); // read fresh tasks on every request
  return <TaskBoard initialTasks={await taskService.list()} />;
}
