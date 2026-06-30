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
import { useCreateProject } from "~/hooks/api/project";
import { useListRepositories, useUpdateRepository } from "~/hooks/api/repository";

function deriveKey(name: string) {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 16);
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  organizationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}) {
  const router = useRouter();
  const { repositories } = useListRepositories(open ? { organizationId } : skipToken);
  const { createProjectAsync, isPending: isCreating } = useCreateProject();
  const { updateRepositoryAsync, isPending: isLinking } = useUpdateRepository();
  const isPending = isCreating || isLinking;

  const [name, setName] = React.useState("");
  const [keyEdited, setKeyEdited] = React.useState(false);
  const [key, setKey] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [repositoryId, setRepositoryId] = React.useState<string | undefined>();

  // Only repos not already owned by another project can be connected.
  const availableRepos = repositories.filter((r) => !r.projectId);

  const effectiveKey = keyEdited ? key : deriveKey(name);
  const canSubmit = Boolean(name.trim() && effectiveKey && repositoryId);

  function reset() {
    setName("");
    setKey("");
    setKeyEdited(false);
    setDescription("");
    setRepositoryId(undefined);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || !repositoryId) return;
    try {
      const { id } = await createProjectAsync({
        organizationId,
        name: name.trim(),
        key: effectiveKey,
        description: description.trim() || undefined,
      });
      if (!id) throw new Error("Failed to create project");

      // Connect the chosen repo to the new project (1 repo per project).
      await updateRepositoryAsync({ id: repositoryId, projectId: id });

      toast.success("Project created");
      onOpenChange(false);
      reset();
      router.push(`/dashboard/projects/${id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create project");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>
              A project connects one repository. Its feature requests, PRDs, tasks, and pull requests
              live here — separate from your other repos.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 grid gap-2">
                <Label htmlFor="proj-name">Name</Label>
                <Input
                  id="proj-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Web App"
                  maxLength={120}
                  required
                  autoFocus
                  disabled={isPending}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="proj-key">Key</Label>
                <Input
                  id="proj-key"
                  value={effectiveKey}
                  onChange={(e) => {
                    setKeyEdited(true);
                    setKey(deriveKey(e.target.value));
                  }}
                  placeholder="WEBAPP"
                  maxLength={16}
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Repository</Label>
              <Select
                value={repositoryId}
                onValueChange={setRepositoryId}
                disabled={isPending || availableRepos.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      availableRepos.length ? "Connect a repository" : "No unconnected repositories"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableRepos.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableRepos.length === 0 ? (
                <p className="text-muted-foreground/70 text-xs">
                  Connect a GitHub repository under Repositories first, then create a project for it.
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="proj-desc">Description (optional)</Label>
              <Textarea
                id="proj-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                disabled={isPending}
              />
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
              Create project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
