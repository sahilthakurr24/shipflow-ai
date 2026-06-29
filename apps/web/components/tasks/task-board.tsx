"use client";

import * as React from "react";
import {
  type CollisionDetection,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

// Target whatever is under the pointer so dropping anywhere over a column works —
// including empty/short columns, which closestCorners misses. Falls back to rect
// intersection for the keyboard sensor (no pointer).
const collisionDetectionStrategy: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  return pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args);
};

import { useMoveTask } from "~/hooks/api/task";
import {
  BOARD_COLUMNS,
  type BoardColumn,
  COLUMN_STATUSES,
  groupTaskIdsByColumn,
  type SortKey,
  type Task,
} from "./columns";
import { KanbanColumn } from "./kanban-column";
import { TaskCardContent } from "./task-card";

type Columns = Record<BoardColumn["status"], string[]>;

const isColumnId = (id: string): id is BoardColumn["status"] =>
  (COLUMN_STATUSES as string[]).includes(id);

export function TaskBoard({
  tasks,
  sort,
  onOpenTask,
  onAddTask,
}: {
  tasks: Task[];
  sort: SortKey;
  onOpenTask: (task: Task) => void;
  onAddTask: (status: BoardColumn["status"]) => void;
}) {
  const { moveTaskAsync } = useMoveTask();

  const tasksById = React.useMemo(() => {
    const map = new Map<string, Task>();
    for (const t of tasks) map.set(t.id, t);
    return map;
  }, [tasks]);

  const [columns, setColumns] = React.useState<Columns>(() => groupTaskIdsByColumn(tasks, sort));
  const [activeId, setActiveId] = React.useState<string | null>(null);

  // Gate cache→local sync so a background poll or our own mutation can't yank a
  // card mid-interaction. Reconcile from the server whenever we're idle.
  const interactingRef = React.useRef(false);
  React.useEffect(() => {
    if (!interactingRef.current) setColumns(groupTaskIdsByColumn(tasks, sort));
  }, [tasks, sort]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const findContainer = React.useCallback(
    (id: string): BoardColumn["status"] | undefined => {
      if (isColumnId(id)) return id;
      return COLUMN_STATUSES.find((status) => columns[status].includes(id));
    },
    [columns],
  );

  function handleDragStart(event: DragStartEvent) {
    interactingRef.current = true;
    setActiveId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setColumns((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const overIndex = isColumnId(overId) ? overItems.length : overItems.indexOf(overId);
      const insertAt = overIndex >= 0 ? overIndex : overItems.length;
      return {
        ...prev,
        [activeContainer]: activeItems.filter((id) => id !== activeId),
        [overContainer]: [...overItems.slice(0, insertAt), activeId, ...overItems.slice(insertAt)],
      };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    const done = () => {
      interactingRef.current = false;
    };

    if (!over) return done();

    const activeId = String(active.id);
    const overId = String(over.id);
    const overContainer = findContainer(overId);
    if (!overContainer) return done();

    // `columns` already reflects handleDragOver's cross-column move, so compute the
    // final order synchronously here (a setState updater would run too late to
    // hand correct orderedIds to the mutation).
    const items = columns[overContainer];
    const fromIndex = items.indexOf(activeId);
    const toIndex = isColumnId(overId)
      ? items.length - 1
      : items.indexOf(overId) >= 0
        ? items.indexOf(overId)
        : items.length - 1;
    const orderedIds =
      fromIndex < 0 ? items : arrayMove(items, fromIndex, Math.max(0, toIndex));

    setColumns((prev) => ({ ...prev, [overContainer]: orderedIds }));

    // Persist; the hook invalidates listTasks on settle, then the effect reconciles.
    void moveTaskAsync({ taskId: activeId, status: overContainer, orderedIds })
      .catch(() => {
        // On failure, drop the interaction lock so the next poll restores truth.
      })
      .finally(done);
  }

  const activeTask = activeId ? tasksById.get(activeId) : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        interactingRef.current = false;
        setColumns(groupTaskIdsByColumn(tasks, sort));
      }}
    >
      <div className="flex h-full min-h-0 gap-4 overflow-x-auto pb-2">
        {BOARD_COLUMNS.map((column) => (
          <KanbanColumn
            key={column.status}
            column={column}
            tasks={columns[column.status]
              .map((id) => tasksById.get(id))
              .filter((t): t is Task => Boolean(t))}
            onOpen={onOpenTask}
            onAdd={onAddTask}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
        {activeTask ? <TaskCardContent task={activeTask} overlay className="w-[284px]" /> : null}
      </DragOverlay>
    </DndContext>
  );
}
