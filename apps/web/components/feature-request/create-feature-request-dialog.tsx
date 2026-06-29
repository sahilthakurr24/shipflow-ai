"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import { useCreateFeatureRequest } from "~/hooks/api/feature-request";
import { useListRepositories } from "~/hooks/api/repository";
import { useOrganization } from "~/providers/organization";

export function CreateFeatureRequestDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { activeOrgId } = useOrganization();
  const { repositories } = useListRepositories(
    activeOrgId ? { organizationId: activeOrgId } : skipToken,
  );
  const { createFeatureRequestAsync, isPending } = useCreateFeatureRequest();

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [repositoryId, setRepositoryId] = React.useState<string | undefined>(undefined);

  const canSubmit =
    Boolean(activeOrgId) &&
    title.trim().length >= 1 &&
    title.trim().length <= 200 &&
    description.trim().length >= 1;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || !activeOrgId) return;

    try {
      const { id } = await createFeatureRequestAsync({
        organizationId: activeOrgId,
        repositoryId,
        title: title.trim(),
        description: description.trim(),
      });
      toast.success("Feature request created");
      onOpenChange(false);
      setTitle("");
      setDescription("");
      setRepositoryId(undefined);
      if (id) router.push(`/dashboard/feature-requests/${id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create feature request");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New feature request</DialogTitle>
            <DialogDescription>
              Describe what you want. The AI clarifies it, writes a PRD, and breaks it into tasks —
              grounded in the repository you pick.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fr-title">Title</Label>
              <Input
                id="fr-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Add rate limiting to login"
                maxLength={200}
                required
                autoFocus
                disabled={isPending}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fr-desc">Description</Label>
              <Textarea
                id="fr-desc"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What problem are you solving? Who's affected? Any constraints (platform, deadline)?"
                rows={5}
                required
                disabled={isPending}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fr-repo">Repository (code context)</Label>
              <Select
                value={repositoryId}
                onValueChange={setRepositoryId}
                disabled={isPending || repositories.length === 0}
              >
                <SelectTrigger id="fr-repo">
                  <SelectValue
                    placeholder={
                      repositories.length ? "Select a repository" : "No connected repositories"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {repositories.map((repo) => (
                    <SelectItem key={repo.id} value={repo.id}>
                      {repo.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                The AI uses this repo&apos;s structure to ground the PRD and tasks.
              </p>
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
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
