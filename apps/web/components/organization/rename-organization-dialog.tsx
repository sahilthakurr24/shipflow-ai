"use client";

import * as React from "react";
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
import { useUpdateOrganization } from "~/hooks/api/organization";
import type { Organization } from "~/providers/organization";

export function RenameOrganizationDialog({
  org,
  open,
  onOpenChange,
}: {
  org: Organization;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { updateOrganizationAsync, isPending } = useUpdateOrganization();
  const [name, setName] = React.useState(org.name);

  React.useEffect(() => {
    if (open) setName(org.name);
  }, [open, org.name]);

  const trimmed = name.trim();
  const isValid = trimmed.length >= 4 && trimmed.length <= 20;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid) return;

    try {
      await updateOrganizationAsync({ id: org.id, name: trimmed });
      toast.success("Organization renamed");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to rename organization");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename organization</DialogTitle>
            <DialogDescription>The URL slug stays the same.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 py-4">
            <Label htmlFor="rename-org">Name</Label>
            <Input
              id="rename-org"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
              minLength={4}
              maxLength={20}
              required
              disabled={isPending}
            />
            <p className="text-muted-foreground text-xs">4–20 characters.</p>
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
            <Button type="submit" disabled={!isValid || isPending}>
              {isPending ? <Loader2 className="animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
