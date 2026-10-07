import { connection } from "next/server";
import { taskHandlers } from "@/features/tasks/server";

// GET /api/tasks/:id
export async function GET(request: Request, context: RouteContext<"/api/tasks/[id]">) {
  await connection(); 
  return taskHandlers.get(request, context);
}

// PATCH /api/tasks/:id
export const PATCH = taskHandlers.update;

// DELETE /api/tasks/:id
export const DELETE = taskHandlers.remove;
