"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileText, Sparkles, TriangleAlert } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { PRIORITY_META, type Task, TYPE_LABEL, timeAgo } from "./columns";

function TaskBadges({ task }: { task: Task }) {
  const priority = PRIORITY_META[task.priority];
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant="outline" className={cn("h-5 rounded-md px-1.5 text-[11px] font-medium", priority.className)}>
        {priority.label}
      </Badge>
      <Badge variant="secondary" className="h-5 rounded-md px-1.5 text-[11px] font-normal">
        {TYPE_LABEL[task.type]}
      </Badge>
      {task.status === "blocked" ? (
        <Badge
          variant="outline"
          className="h-5 gap-1 rounded-md border-red-500/30 bg-red-500/10 px-1.5 text-[11px] text-red-600 dark:text-red-400"
        >
          <TriangleAlert className="size-3" />
          Blocked
        </Badge>
      ) : null}
    </div>
  );
}

/** Presentational card body — shared by the sortable card and the drag overlay. */
export const TaskCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { task: Task; dragging?: boolean; overlay?: boolean }
>(function TaskCardContent({ task, dragging, overlay, className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "bg-card group/card flex flex-col gap-2.5 rounded-xl border p-3 text-left shadow-sm transition-all",
        "hover:border-foreground/20 hover:shadow-md",
        dragging && "opacity-40",
        overlay && "rotate-2 cursor-grabbing border-foreground/20 shadow-xl",
        !overlay && "cursor-grab active:cursor-grabbing",
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-sm font-medium leading-snug">{task.title}</p>
        {task.createdByAgent ? (
          <Sparkles className="text-muted-foreground/60 mt-0.5 size-3.5 shrink-0" aria-label="AI generated" />
        ) : null}
      </div>

      {task.description ? (
        <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
          {task.description}
        </p>
      ) : null}

      <TaskBadges task={task} />

      <div className="text-muted-foreground/80 flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2">
          {task.prdId ? (
            <span className="inline-flex items-center gap-1">
              <FileText className="size-3" />
              PRD
            </span>
          ) : null}
          {task.estimatePoints != null ? (
            <span className="bg-muted inline-flex items-center rounded px-1 font-medium">
              {task.estimatePoints} pts
            </span>
          ) : null}
        </div>
        <span>{timeAgo(task.updatedAt)}</span>
      </div>
    </div>
  );
});

function SortableTaskCardImpl({ task, onOpen }: { task: Task; onOpen: (task: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  // Distinguish a click (open the panel) from a drag: remember where the pointer
  // went down and only open if it barely moved. This keeps the whole card
  // draggable while still letting a plain click open the detail drawer.
  const downPos = React.useRef<{ x: number; y: number } | null>(null);

  return (
    <TaskCardContent
      ref={setNodeRef}
      task={task}
      dragging={isDragging}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onPointerDown={(event) => {
        downPos.current = { x: event.clientX, y: event.clientY };
        listeners?.onPointerDown?.(event);
      }}
      onClick={(event) => {
        const start = downPos.current;
        if (start && (Math.abs(event.clientX - start.x) > 6 || Math.abs(event.clientY - start.y) > 6)) {
          return; // it was a drag, not a click
        }
        onOpen(task);
      }}
    />
  );
}

// Memoized so unaffected cards don't re-render during drags or polls.
export const SortableTaskCard = React.memo(SortableTaskCardImpl);
