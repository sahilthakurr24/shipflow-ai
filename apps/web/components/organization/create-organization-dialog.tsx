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
import { useCreateOrganization } from "~/hooks/api/organization";
import { useOrganization } from "~/providers/organization";

export function CreateOrganizationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { setActiveOrg } = useOrganization();
  const { createOrganizationAsync, isPending } = useCreateOrganization();
  const [name, setName] = React.useState("");

  const trimmed = name.trim();
  const isValid = trimmed.length >= 4 && trimmed.length <= 20;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid) return;

    try {
      const { id } = await createOrganizationAsync({ name: trimmed });
      if (id) setActiveOrg(id);
      toast.success("Organization created");
      setName("");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create organization");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create organization</DialogTitle>
            <DialogDescription>
              An organization groups your repositories, PRDs, and team. You can switch between
              organizations anytime.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 py-4">
            <Label htmlFor="org-name">Name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Acme Inc"
              autoFocus
              minLength={4}
              maxLength={20}
              required
              disabled={isPending}
            />
            <p className="text-muted-foreground text-xs">
              4–20 characters. A unique URL slug is generated automatically.
            </p>
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
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
