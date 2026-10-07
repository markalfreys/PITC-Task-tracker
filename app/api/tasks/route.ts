import { connection } from "next/server";
import { taskHandlers } from "@/features/tasks/server";

// GET /api/tasks
export async function GET(request: Request) {
  await connection(); // don't cache this response
  return taskHandlers.list(request, undefined);
}

// POST /api/tasks
export const POST = taskHandlers.create;
