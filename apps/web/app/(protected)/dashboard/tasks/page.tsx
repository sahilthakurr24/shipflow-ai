"use client";

import * as React from "react";
import { skipToken } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Building2, ListChecks, Plus, Sparkles } from "lucide-react";

import { BoardSkeleton } from "~/components/tasks/board-skeleton";
import type { BoardColumn } from "~/components/tasks/columns";
import { CreateTaskDialog } from "~/components/tasks/create-task-dialog";
import { GenerateTasksDialog } from "~/components/tasks/generate-tasks-dialog";
import { TaskBoard } from "~/components/tasks/task-board";
import { TaskDrawer } from "~/components/tasks/task-drawer";
import {
  type BoardFilters,
  EMPTY_FILTERS,
  type SortKey,
  TaskToolbar,
} from "~/components/tasks/task-toolbar";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { useOrganization } from "~/providers/organization";
import { trpc } from "~/trpc/client";

export default function TasksPage() {
  const { activeOrgId } = useOrganization();

  const tasksQuery = trpc.task.listTasks.useQuery(
    activeOrgId ? { organizationId: activeOrgId } : skipToken,
    { refetchInterval: 3000, refetchOnWindowFocus: true },
  );
  const allTasks = React.useMemo(() => tasksQuery.data?.tasks ?? [], [tasksQuery.data]);

  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<BoardFilters>(EMPTY_FILTERS);
  const [sort, setSort] = React.useState<SortKey>("manual");

  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createStatus, setCreateStatus] = React.useState<BoardColumn["status"]>("todo");
  const [generateOpen, setGenerateOpen] = React.useState(false);

  const filteredTasks = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return allTasks.filter((t) => {
      if (q && !`${t.title} ${t.description ?? ""}`.toLowerCase().includes(q)) return false;
      if (filters.priorities.length && !filters.priorities.includes(t.priority)) return false;
      if (filters.types.length && !filters.types.includes(t.type)) return false;
      if (filters.aiOnly && !t.createdByAgent) return false;
      return true;
    });
  }, [allTasks, search, filters]);

  const selectedTask = selectedTaskId
    ? (allTasks.find((t) => t.id === selectedTaskId) ?? null)
    : null;

  function openTask(taskId: string) {
    setSelectedTaskId(taskId);
    setDrawerOpen(true);
  }

  function addTask(status: BoardColumn["status"]) {
    setCreateStatus(status);
    setCreateOpen(true);
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Tasks</h2>
          <p className="text-muted-foreground text-sm">
            Plan and track engineering work across the delivery pipeline.
          </p>
        </div>
      </header>

      {!activeOrgId ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Building2 className="text-muted-foreground size-6" />
            <p className="text-muted-foreground text-sm">Select an organization to view its board.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <TaskToolbar
            search={search}
            onSearchChange={setSearch}
            filters={filters}
            onFiltersChange={setFilters}
            sort={sort}
            onSortChange={setSort}
            onCreate={() => addTask("todo")}
            onGenerate={() => setGenerateOpen(true)}
            onRefresh={() => void tasksQuery.refetch()}
            refreshing={tasksQuery.isFetching}
          />

          {tasksQuery.isLoading ? (
            <div className="min-h-0 flex-1">
              <BoardSkeleton />
            </div>
          ) : tasksQuery.isError ? (
            <Card>
              <CardContent className="text-destructive py-10 text-center text-sm">
                Couldn&apos;t load tasks. Try refreshing.
              </CardContent>
            </Card>
          ) : allTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                <ListChecks className="text-muted-foreground size-6" />
                <p className="font-medium">No tasks yet</p>
                <p className="text-muted-foreground max-w-sm text-sm">
                  Generate tasks from an approved PRD, or create one manually.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setGenerateOpen(true)}>
                    <Sparkles className="size-4" />
                    AI Generate Tasks
                  </Button>
                  <Button onClick={() => addTask("todo")}>
                    <Plus className="size-4" />
                    New task
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="min-h-0 min-w-0 flex-1"
            >
              <TaskBoard
                tasks={filteredTasks}
                sort={sort}
                onOpenTask={(t) => openTask(t.id)}
                onAddTask={addTask}
              />
            </motion.div>
          )}

          <CreateTaskDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            organizationId={activeOrgId}
            defaultStatus={createStatus}
          />
          <GenerateTasksDialog
            open={generateOpen}
            onOpenChange={setGenerateOpen}
            organizationId={activeOrgId}
          />
          <TaskDrawer task={selectedTask} open={drawerOpen} onOpenChange={setDrawerOpen} />
        </>
      )}
    </div>
  );
}
