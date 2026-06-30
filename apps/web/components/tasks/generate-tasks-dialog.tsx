"use client";

import * as React from "react";
import { skipToken } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
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
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useListPrds } from "~/hooks/api/prd";
import { useGenerateTasks } from "~/hooks/api/task";

export function GenerateTasksDialog({
  open,
  onOpenChange,
  organizationId,
  projectId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  projectId?: string;
}) {
  const { prds } = useListPrds(open ? { organizationId, projectId } : skipToken);
  const { generateTasksAsync, isPending } = useGenerateTasks();
  const [prdId, setPrdId] = React.useState<string | undefined>();

  // Approved PRDs first — they're the natural source for task generation.
  const sorted = React.useMemo(
    () =>
      [...prds].sort(
        (a, b) =>
          (b.approvedAt ? 1 : 0) - (a.approvedAt ? 1 : 0) ||
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [prds],
  );

  async function handleGenerate() {
    if (!prdId) return;
    try {
      await generateTasksAsync({ prdId });
      toast.success("Generating tasks — they'll appear on the board shortly");
      onOpenChange(false);
      setPrdId(undefined);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start task generation");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4" />
            AI Generate Tasks
          </DialogTitle>
          <DialogDescription>
            Pick a PRD and the AI will break it into engineering tasks on this board.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 py-2">
          <Label>PRD</Label>
          <Select value={prdId} onValueChange={setPrdId} disabled={isPending || sorted.length === 0}>
            <SelectTrigger>
              <SelectValue placeholder={sorted.length ? "Select a PRD" : "No PRDs yet"} />
            </SelectTrigger>
            <SelectContent>
              {sorted.map((prd) => (
                <SelectItem key={prd.id} value={prd.id}>
                  {prd.title} (v{prd.version}){prd.approvedAt ? " · approved" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={!prdId || isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Sparkles className="size-4" />}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
