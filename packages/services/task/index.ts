import { db, and, eq } from "@repo/database";
import { tasksTable } from "@repo/database/schema";
import {
  createTaskInput,
  CreateTaskInputType,
  listTasksInput,
  ListTasksInputType,
  moveTaskInput,
  MoveTaskInputType,
  taskIdInput,
  TaskIdInputType,
  updateTaskInput,
  UpdateTaskInputType,
} from "./model";

class TaskService {
  public async createTask(payload: CreateTaskInputType) {
    const values = await createTaskInput.parseAsync(payload);

    const [result] = await db.insert(tasksTable).values(values).returning({ id: tasksTable.id });

    return { id: result?.id };
  }

  public async getTaskById(payload: TaskIdInputType) {
    const { id } = await taskIdInput.parseAsync(payload);

    const [result] = await db.select().from(tasksTable).where(eq(tasksTable.id, id));

    return { task: result };
  }

  public async listTasks(payload: ListTasksInputType) {
    const { organizationId, featureRequestId } = await listTasksInput.parseAsync(payload);

    const conditions = [eq(tasksTable.organizationId, organizationId)];
    if (featureRequestId) conditions.push(eq(tasksTable.featureRequestId, featureRequestId));

    const tasks = await db
      .select()
      .from(tasksTable)
      .where(and(...conditions));

    return { tasks };
  }

  public async updateTask(payload: UpdateTaskInputType) {
    const { id, ...fields } = await updateTaskInput.parseAsync(payload);

    const [result] = await db
      .update(tasksTable)
      .set(fields)
      .where(eq(tasksTable.id, id))
      .returning({ id: tasksTable.id });

    return { id: result?.id };
  }

  public async deleteTask(payload: TaskIdInputType) {
    const { id } = await taskIdInput.parseAsync(payload);

    await db.delete(tasksTable).where(eq(tasksTable.id, id));
  }

  /**
   * Moves a task to a column (`status`) and reindexes that column's order in a
   * single transaction. `organizationId` is server-supplied (from the loaded
   * task) and scopes every write so a crafted `orderedIds` can't touch another
   * org's rows.
   */
  public async moveTask(payload: MoveTaskInputType & { organizationId: string }) {
    const { taskId, status, orderedIds } = await moveTaskInput.parseAsync(payload);
    const { organizationId } = payload;

    await db.transaction(async (tx) => {
      await tx
        .update(tasksTable)
        .set({ status })
        .where(and(eq(tasksTable.id, taskId), eq(tasksTable.organizationId, organizationId)));

      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(tasksTable)
          .set({ boardPosition: i })
          .where(
            and(eq(tasksTable.id, orderedIds[i]!), eq(tasksTable.organizationId, organizationId)),
          );
      }
    });

    return { id: taskId };
  }
}

export default TaskService;
