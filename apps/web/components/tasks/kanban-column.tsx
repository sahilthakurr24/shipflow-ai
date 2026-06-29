"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { type BoardColumn, type Task } from "./columns";
import { SortableTaskCard } from "./task-card";

export function KanbanColumn({
  column,
  tasks,
  onOpen,
  onAdd,
}: {
  column: BoardColumn;
  tasks: Task[];
  onOpen: (task: Task) => void;
  onAdd: (status: BoardColumn["status"]) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status, data: { type: "column" } });
  const Icon = column.icon;
  const ids = React.useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <div className="flex h-full w-[300px] shrink-0 flex-col">
      {/* Sticky header */}
      <div className="bg-background/80 sticky top-0 z-10 flex items-center justify-between gap-2 rounded-t-xl px-1 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Icon className={cn("size-4", column.accent)} />
          <span className="text-sm font-semibold">{column.label}</span>
          <span className="text-muted-foreground bg-muted rounded-full px-1.5 text-xs font-medium tabular-nums">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground size-7"
          aria-label={`Add task to ${column.label}`}
          onClick={() => onAdd(column.status)}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {/* Scrollable body */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2.5 overflow-y-auto rounded-xl border border-transparent p-1.5 transition-colors",
          isOver && "border-foreground/15 bg-muted/40",
        )}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onOpen={onOpen} />
          ))}
        </SortableContext>

        {tasks.length === 0 ? (
          <button
            type="button"
            onClick={() => onAdd(column.status)}
            className="border-muted-foreground/15 text-muted-foreground/60 hover:border-foreground/20 hover:text-muted-foreground flex min-h-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-xs transition-colors"
          >
            <Plus className="size-4" />
            Add a task
          </button>
        ) : null}
      </div>
    </div>
  );
}
