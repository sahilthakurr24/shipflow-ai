"use client";

import * as React from "react";
import { skipToken } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { useListFeatureRequests } from "~/hooks/api/feature-request";
import { useListPrds } from "~/hooks/api/prd";
import { useCreateTask } from "~/hooks/api/task";
import {
  BOARD_COLUMNS,
  type BoardColumn,
  PRIORITY_META,
  TASK_PRIORITIES,
  TASK_TYPES,
  type TaskPriority,
  type TaskType,
  TYPE_LABEL,
} from "./columns";

export function CreateTaskDialog({
  open,
  onOpenChange,
  organizationId,
  projectId,
  defaultStatus = "todo",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  projectId?: string;
  defaultStatus?: BoardColumn["status"];
}) {
  // defaultStatus falls back to "todo" — the board's first column.
  const { featureRequests } = useListFeatureRequests(
    open ? { organizationId, projectId } : skipToken,
  );
  const { createTaskAsync, isPending } = useCreateTask();

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [featureRequestId, setFeatureRequestId] = React.useState<string | undefined>();
  const [prdId, setPrdId] = React.useState<string | undefined>();
  const [type, setType] = React.useState<TaskType>("feature");
  const [priority, setPriority] = React.useState<TaskPriority>("medium");
  const [status, setStatus] = React.useState<BoardColumn["status"]>(defaultStatus);

  // PRDs scoped to the chosen feature request.
  const { prds } = useListPrds(
    featureRequestId ? { organizationId, featureRequestId } : skipToken,
  );

  React.useEffect(() => {
    if (open) setStatus(defaultStatus);
  }, [open, defaultStatus]);

  const canSubmit = Boolean(featureRequestId) && title.trim().length > 0;

  function reset() {
    setTitle("");
    setDescription("");
    setFeatureRequestId(undefined);
    setPrdId(undefined);
    setType("feature");
    setPriority("medium");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || !featureRequestId) return;
    try {
      await createTaskAsync({
        organizationId,
        projectId,
        featureRequestId,
        prdId,
        title: title.trim(),
        description: description.trim() || null,
        type,
        priority,
        status,
      });
      toast.success("Task created");
      onOpenChange(false);
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create task");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
            <DialogDescription>
              Add a task to the board. It must belong to a feature request.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add rate-limit middleware to /api/login"
                maxLength={200}
                required
                autoFocus
                disabled={isPending}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="task-desc">Description</Label>
              <Textarea
                id="task-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What needs to be done, and any constraints."
                rows={3}
                disabled={isPending}
              />
            </div>

            <div className="grid gap-2">
              <Label>Feature request</Label>
              <Select
                value={featureRequestId}
                onValueChange={(v) => {
                  setFeatureRequestId(v);
                  setPrdId(undefined);
                }}
                disabled={isPending || featureRequests.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      featureRequests.length ? "Select a feature request" : "No feature requests"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {featureRequests.map((fr) => (
                    <SelectItem key={fr.id} value={fr.id}>
                      {fr.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {prds.length > 0 ? (
              <div className="grid gap-2">
                <Label>Linked PRD (optional)</Label>
                <Select value={prdId} onValueChange={setPrdId} disabled={isPending}>
                  <SelectTrigger>
                    <SelectValue placeholder="No PRD" />
                  </SelectTrigger>
                  <SelectContent>
                    {prds.map((prd) => (
                      <SelectItem key={prd.id} value={prd.id}>
                        {prd.title} (v{prd.version})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as TaskType)} disabled={isPending}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {TYPE_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as TaskPriority)}
                  disabled={isPending}
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
              </div>
              <div className="grid gap-2">
                <Label>Column</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as BoardColumn["status"])}
                  disabled={isPending}
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
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || isPending}>
              {isPending ? <Loader2 className="animate-spin" /> : null}
              Create task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
