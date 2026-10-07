import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import TaskDetails from "@/features/tasks/components/TaskDetails";
import { taskService } from "@/features/tasks/server";
import { isValidTaskId } from "@/features/tasks/validation";
import styles from "./page.module.css";

export default function TaskPage({ params }: PageProps<"/tasks/[id]">) {
  return (
    <>
      <Link href="/" className={styles.backLink}>
        ← Back to tasks
      </Link>

      <Suspense fallback={<p className="muted">Loading task…</p>}>
        <TaskDetailsLoader params={params} />
      </Suspense>
    </>
  );
}

async function TaskDetailsLoader({ params }: Pick<PageProps<"/tasks/[id]">, "params">) {
  await connection();
  const { id } = await params;
  const task = isValidTaskId(id) ? await taskService.get(id) : undefined;
  if (!task) notFound();

  return <TaskDetails task={task} />;
}
