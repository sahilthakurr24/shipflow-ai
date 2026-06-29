import { Circle, CircleCheckBig, Eye, Timer, type LucideIcon } from "lucide-react";

import type { RouterOutputs } from "@repo/trpc/client";

export type Task = RouterOutputs["task"]["listTasks"]["tasks"][number];
export type TaskStatus = Task["status"];
export type TaskPriority = Task["priority"];
export type TaskType = Task["type"];

export type BoardColumn = {
  status: Exclude<TaskStatus, "blocked">;
  label: string;
  icon: LucideIcon;
  /** Tailwind text-color class for the column's status dot/icon. */
  accent: string;
};

// Ordered left-to-right. Statuses without a column (backlog, testing, blocked)
// surface in Todo via columnForStatus; `blocked` also shows a card badge.
export const BOARD_COLUMNS: readonly BoardColumn[] = [
  { status: "todo", label: "Todo", icon: Circle, accent: "text-zinc-400" },
  { status: "in_progress", label: "In Progress", icon: Timer, accent: "text-amber-500" },
  { status: "in_review", label: "In Review", icon: Eye, accent: "text-violet-500" },
  { status: "done", label: "Done", icon: CircleCheckBig, accent: "text-emerald-500" },
];

export const COLUMN_STATUSES = BOARD_COLUMNS.map((c) => c.status);

/** Where a task renders: its own status, or Todo as a fallback (backlog/testing/blocked). */
export function columnForStatus(status: TaskStatus): BoardColumn["status"] {
  return (COLUMN_STATUSES as TaskStatus[]).includes(status)
    ? (status as BoardColumn["status"])
    : "todo";
}

export const PRIORITY_META: Record<TaskPriority, { label: string; className: string }> = {
  urgent: { label: "Urgent", className: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400" },
  high: { label: "High", className: "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  medium: { label: "Medium", className: "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  low: { label: "Low", className: "border-zinc-400/30 bg-zinc-400/10 text-zinc-500 dark:text-zinc-400" },
};

export const TYPE_LABEL: Record<TaskType, string> = {
  feature: "Feature",
  bug: "Bug",
  chore: "Chore",
  test: "Test",
  docs: "Docs",
  spike: "Spike",
};

export const TASK_PRIORITIES: TaskPriority[] = ["urgent", "high", "medium", "low"];
export const TASK_TYPES: TaskType[] = ["feature", "bug", "chore", "test", "docs", "spike"];

export type SortKey = "manual" | "priority" | "recent";

const PRIORITY_RANK: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

/** Compact relative time, e.g. "3m", "2h", "5d". */
export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function compareTasks(sort: SortKey) {
  return (a: Task, b: Task) => {
    if (sort === "priority") {
      const d = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (d !== 0) return d;
    } else if (sort === "recent") {
      const d = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (d !== 0) return d;
    }
    return a.boardPosition - b.boardPosition || a.title.localeCompare(b.title);
  };
}

/** Groups tasks into ordered column buckets (ids only), ordered by the sort key. */
export function groupTaskIdsByColumn(
  tasks: Task[],
  sort: SortKey = "manual",
): Record<BoardColumn["status"], string[]> {
  const groups = Object.fromEntries(COLUMN_STATUSES.map((s) => [s, [] as string[]])) as Record<
    BoardColumn["status"],
    string[]
  >;
  const byColumn = new Map<BoardColumn["status"], Task[]>();
  for (const status of COLUMN_STATUSES) byColumn.set(status, []);
  for (const task of tasks) byColumn.get(columnForStatus(task.status))!.push(task);
  const cmp = compareTasks(sort);
  for (const status of COLUMN_STATUSES) {
    groups[status] = byColumn.get(status)!.slice().sort(cmp).map((t) => t.id);
  }
  return groups;
}
