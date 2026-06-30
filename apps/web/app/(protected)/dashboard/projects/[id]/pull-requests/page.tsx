"use client";

import * as React from "react";
import Link from "next/link";
import { skipToken } from "@tanstack/react-query";
import { ChevronRight, GitPullRequest, RefreshCw } from "lucide-react";

import { PrStateBadge, timeAgo } from "~/components/pull-request/shared";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { useListPullRequests, useSyncPullRequests } from "~/hooks/api/pull-request";
import { useListRepositories } from "~/hooks/api/repository";
import { useOrganization } from "~/providers/organization";
import { cn } from "~/lib/utils";
import { useParams } from "next/navigation";

export default function PullRequestsPage() {
  const { activeOrgId } = useOrganization();
  const projectId = useParams<{ id: string }>().id;
  const { repositories } = useListRepositories(
    activeOrgId ? { organizationId: activeOrgId } : skipToken,
  );
  const projectRepoId = repositories.find((r) => r.projectId === projectId)?.id;

  const { pullRequests, isLoading, error } = useListPullRequests(
    activeOrgId && projectRepoId
      ? { organizationId: activeOrgId, repositoryId: projectRepoId }
      : skipToken,
  );
  const { syncPullRequestsAsync, isPending: isSyncing } = useSyncPullRequests();
  const isError = Boolean(error);

  const sync = React.useCallback(() => {
    if (!activeOrgId) return;
    void syncPullRequestsAsync({ organizationId: activeOrgId }).catch(() => {
      // Surfaced by the empty/error states; sync failures shouldn't crash the page.
    });
  }, [activeOrgId, syncPullRequestsAsync]);

  // Auto-import open PRs from GitHub once when the page opens for an org.
  const syncedOrg = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (activeOrgId && syncedOrg.current !== activeOrgId) {
      syncedOrg.current = activeOrgId;
      sync();
    }
  }, [activeOrgId, sync]);

  // Show open PRs only.
  const sorted = [...pullRequests]
    .filter((pr) => pr.state === "open")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Pull Requests</h2>
          <p className="text-muted-foreground text-sm">
            Open PRs from your connected repositories, with their AI review.
          </p>
        </div>
        <Button variant="outline" onClick={sync} disabled={!activeOrgId || isSyncing}>
          <RefreshCw className={cn("size-4", isSyncing && "animate-spin")} />
          {isSyncing ? "Syncing…" : "Sync"}
        </Button>
      </header>

      {!activeOrgId ? (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center text-sm">
            Select an organization first.
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="text-destructive py-10 text-center text-sm">
            Couldn&apos;t load pull requests.
          </CardContent>
        </Card>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            {isSyncing ? (
              <>
                <RefreshCw className="text-muted-foreground size-6 animate-spin" />
                <p className="text-muted-foreground text-sm">Syncing open PRs from GitHub…</p>
              </>
            ) : (
              <>
                <GitPullRequest className="text-muted-foreground size-6" />
                <p className="font-medium">No open pull requests</p>
                <p className="text-muted-foreground max-w-sm text-sm">
                  Open a PR on a connected GitHub repository, then hit Sync — it&apos;ll appear here
                  for AI review.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((pr) => (
            <Link
              key={pr.id}
              href={`/dashboard/projects/${projectId}/pull-requests/${pr.id}`}
              className="group focus-visible:ring-ring block rounded-xl focus-visible:ring-2 focus-visible:outline-none"
            >
              <Card className="hover:border-foreground/20 transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-center gap-3">
                  <GitPullRequest className="text-muted-foreground size-5 shrink-0" />
                  <div className="grid min-w-0 flex-1 gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium">{pr.title}</span>
                      <span className="text-muted-foreground text-xs">#{pr.githubPrNumber}</span>
                      <PrStateBadge state={pr.state} />
                    </div>
                    <span className="text-muted-foreground line-clamp-1 text-xs">
                      {pr.authorLogin ? `${pr.authorLogin} · ` : ""}
                      {pr.headBranch ?? "?"} → {pr.baseBranch ?? "?"} ·{" "}
                      <span className="text-emerald-600 dark:text-emerald-400">+{pr.additions}</span>{" "}
                      <span className="text-red-600 dark:text-red-400">-{pr.deletions}</span> ·{" "}
                      {timeAgo(pr.updatedAt)}
                    </span>
                  </div>
                  <ChevronRight className="text-muted-foreground group-hover:text-foreground size-4 shrink-0 transition-colors" />
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
