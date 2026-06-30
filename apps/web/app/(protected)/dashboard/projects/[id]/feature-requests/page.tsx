"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { skipToken } from "@tanstack/react-query";
import { ChevronRight, Lightbulb, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { CreateFeatureRequestDialog } from "~/components/feature-request/create-feature-request-dialog";
import { ConnectGithubCard } from "~/components/github/connect-github";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import {
  useDeleteFeatureRequest,
  useListFeatureRequests,
} from "~/hooks/api/feature-request";
import { useGetGithubInstallUrl, useListRepositories } from "~/hooks/api/repository";
import { useOrganization } from "~/providers/organization";

function humanize(status: string) {
  return status.replace(/_/g, " ");
}

type FeatureRequestListItem = {
  id: string;
  title: string;
  status: string;
  description: string;
};

function FeatureRequestRow({ fr }: { fr: FeatureRequestListItem }) {
  const projectId = useParams<{ id: string }>().id;
  const [open, setOpen] = React.useState(false);
  const { deleteFeatureRequestAsync, isPending } = useDeleteFeatureRequest();

  async function handleDelete() {
    try {
      await deleteFeatureRequestAsync({ id: fr.id });
      toast.success("Feature request deleted");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete feature request");
    }
  }

  return (
    <Card className="hover:border-foreground/20 group relative transition-all hover:shadow-md">
      {/* Full-card click target sits behind the content so the delete button stays usable. */}
      <Link
        href={`/dashboard/projects/${projectId}/feature-requests/${fr.id}`}
        aria-label={fr.title}
        className="focus-visible:ring-ring absolute inset-0 z-0 rounded-xl focus-visible:ring-2 focus-visible:outline-none"
      />
      <CardHeader className="pointer-events-none relative z-10 flex flex-row items-center gap-3">
        <div className="grid min-w-0 flex-1 gap-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{fr.title}</span>
            <Badge variant="secondary" className="capitalize">
              {humanize(fr.status)}
            </Badge>
          </div>
          <span className="text-muted-foreground line-clamp-1 text-xs">{fr.description}</span>
        </div>

        <AlertDialog open={open} onOpenChange={setOpen}>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete feature request"
            className="text-muted-foreground hover:text-destructive pointer-events-auto shrink-0"
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setOpen(true);
            }}
          >
            {isPending ? <Loader2 className="animate-spin" /> : <Trash2 className="size-4" />}
          </Button>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this feature request?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes &ldquo;{fr.title}&rdquo; along with its conversation and any
                generated PRD. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault();
                  void handleDelete();
                }}
                disabled={isPending}
                className="bg-destructive hover:bg-destructive/90 text-white"
              >
                {isPending ? <Loader2 className="animate-spin" /> : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <ChevronRight className="text-muted-foreground group-hover:text-foreground size-4 shrink-0 transition-colors" />
      </CardHeader>
    </Card>
  );
}

export default function FeatureRequestsPage() {
  const { activeOrgId } = useOrganization();
  const projectId = useParams<{ id: string }>().id;
  const { featureRequests, isLoading, error } = useListFeatureRequests(
    activeOrgId ? { organizationId: activeOrgId, projectId } : skipToken,
  );
  const { repositories, isLoading: reposLoading } = useListRepositories(
    activeOrgId ? { organizationId: activeOrgId } : skipToken,
  );
  const { url: installUrl } = useGetGithubInstallUrl(
    activeOrgId ? { organizationId: activeOrgId } : skipToken,
  );
  const [createOpen, setCreateOpen] = React.useState(false);
  const isError = Boolean(error);
  // The project's connected repo grounds AI context for its feature requests.
  const projectRepo = repositories.find((r) => r.projectId === projectId);
  const hasGithub = Boolean(projectRepo);
  const loading = isLoading || reposLoading;

  const sorted = [...featureRequests].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const list = (
    <div className="flex flex-col gap-3">
      {sorted.map((fr) => (
        <FeatureRequestRow key={fr.id} fr={fr} />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Feature Requests</h2>
          <p className="text-muted-foreground text-sm">
            Describe a feature; the AI clarifies it, writes a PRD, and plans the work.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} disabled={!activeOrgId || !hasGithub}>
          <Plus />
          New feature request
        </Button>
      </header>

      {!activeOrgId ? (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center text-sm">
            Select an organization first.
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="text-destructive py-10 text-center text-sm">
            Couldn&apos;t load feature requests.
          </CardContent>
        </Card>
      ) : !hasGithub ? (
        // No GitHub connection → feature requests can't be grounded in a repo yet.
        <div className="flex flex-col gap-3">
          <ConnectGithubCard
            url={installUrl}
            title="Connect GitHub to start"
            description="Feature requests are grounded in one of your repositories. Install the ShipFlow GitHub App to connect a repo, then describe your first feature."
          />
          {sorted.length > 0 ? list : null}
        </div>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Lightbulb className="text-muted-foreground size-6" />
            <p className="text-muted-foreground text-sm">No feature requests yet.</p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus />
              Create your first one
            </Button>
          </CardContent>
        </Card>
      ) : (
        list
      )}

      <CreateFeatureRequestDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectId={projectId}
        projectRepositoryId={projectRepo?.id}
      />
    </div>
  );
}
