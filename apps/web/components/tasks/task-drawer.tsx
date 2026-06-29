"use client";

import * as React from "react";
import Link from "next/link";
import { skipToken } from "@tanstack/react-query";
import { ArrowUpRight, Check, Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Textarea } from "~/components/ui/textarea";
import { useListAcceptanceCriteria } from "~/hooks/api/prd";
import { useDeleteTask, useUpdateTask } from "~/hooks/api/task";
import {
  BOARD_COLUMNS,
  columnForStatus,
  PRIORITY_META,
  TASK_PRIORITIES,
  type Task,
  type TaskPriority,
  type TaskStatus,
  TYPE_LABEL,
} from "./columns";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function TaskDrawer({
  task,
  open,
  onOpenChange,
}: {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { updateTaskAsync, isPending: isSaving } = useUpdateTask();
  const { deleteTaskAsync, isPending: isDeleting } = useDeleteTask();
  const { acceptanceCriteria } = useListAcceptanceCriteria(
    task?.prdId ? { prdId: task.prdId } : skipToken,
  );

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");

  // Reseed the editable fields whenever a different task opens.
  React.useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
    }
  }, [task]);

  if (!task) return null;

  const dirty = title.trim() !== task.title || description.trim() !== (task.description ?? "");

  async function patch(fields: Parameters<typeof updateTaskAsync>[0]) {
    try {
      await updateTaskAsync(fields);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update task");
    }
  }

  async function saveText() {
    if (!title.trim()) {
      toast.error("Title can't be empty");
      return;
    }
    await patch({ id: task!.id, title: title.trim(), description: description.trim() });
    toast.success("Task saved");
  }

  async function handleDelete() {
    try {
      await deleteTaskAsync({ id: task!.id });
      toast.success("Task deleted");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete task");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="gap-1 border-b px-5 pt-5 pb-4">
          <div className="flex items-center gap-2">
            {task.createdByAgent ? (
              <Badge variant="secondary" className="gap-1 text-[11px]">
                <Sparkles className="size-3" />
                AI generated
              </Badge>
            ) : null}
            <Badge variant="outline" className="text-[11px]">
              {TYPE_LABEL[task.type]}
            </Badge>
          </div>
          <DialogTitle className="sr-only">Task details</DialogTitle>
          <DialogDescription className="sr-only">View and edit task</DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </Field>

          <Field label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="No description."
            />
          </Field>

          {dirty ? (
            <Button size="sm" className="self-start" onClick={saveText} disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" /> : <Check className="size-4" />}
              Save changes
            </Button>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <Select
                value={columnForStatus(task.status)}
                onValueChange={(v) => patch({ id: task.id, status: v as TaskStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BOARD_COLUMNS.map((c) => (
                    <SelectItem key={c.status} value={c.status}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Priority">
              <Select
                value={task.priority}
                onValueChange={(v) => patch({ id: task.id, priority: v as TaskPriority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_META[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {task.estimatePoints != null ? (
            <Field label="Estimated effort">
              <span className="text-sm">{task.estimatePoints} points</span>
            </Field>
          ) : null}

          {task.prdId ? (
            <Field label="Linked PRD">
              <Button asChild variant="outline" size="sm" className="self-start">
                <Link href={`/dashboard/prds/${task.prdId}`}>
                  Open PRD
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </Field>
          ) : null}

          {acceptanceCriteria.length > 0 ? (
            <Field label="Acceptance criteria (from PRD)">
              <ul className="space-y-1.5 text-sm">
                {acceptanceCriteria.map((c) => (
                  <li key={c.id} className="flex gap-2">
                    <Check className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
                    <span className="leading-relaxed">{c.description}</span>
                  </li>
                ))}
              </ul>
            </Field>
          ) : null}

          <Separator />

          <Field label="Activity">
            <ul className="text-muted-foreground space-y-1.5 text-xs">
              <li>Created {new Date(task.createdAt).toLocaleString()}</li>
              <li>Last updated {new Date(task.updatedAt).toLocaleString()}</li>
            </ul>
          </Field>

          <Field label="Comments">
            <p className="text-muted-foreground/70 rounded-lg border border-dashed p-3 text-xs">
              Comments are coming soon.
            </p>
          </Field>

          <Separator />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive self-start"
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 className="size-4" />}
                Delete task
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                <AlertDialogDescription>
                  &ldquo;{task.title}&rdquo; will be permanently removed. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    void handleDelete();
                  }}
                  disabled={isDeleting}
                  className="bg-destructive hover:bg-destructive/90 text-white"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  );
}
