"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { skipToken } from "@tanstack/react-query";
import { ChevronDown, Folder, GitPullRequest, Inbox, RefreshCw } from "lucide-react";
import type { RouterOutputs } from "@repo/trpc/client";

import { PrStateBadge, timeAgo } from "~/components/pull-request/shared";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { Skeleton } from "~/components/ui/skeleton";
import { useListFeatureRequests } from "~/hooks/api/feature-request";
import { useListPullRequests, useSyncPullRequests } from "~/hooks/api/pull-request";
import { useListRepositories } from "~/hooks/api/repository";
import { useOrganization } from "~/providers/organization";
import { cn } from "~/lib/utils";

type Pr = RouterOutputs["pullRequest"]["listPullRequests"]["pullRequests"][number];

const UNLINKED = "__unlinked__";

function PrRow({ pr, projectId }: { pr: Pr; projectId: string }) {
  return (
    <Link
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
        </CardHeader>
      </Card>
    </Link>
  );
}

function FeatureGroup({
  title,
  count,
  unlinked,
  children,
}: {
  title: string;
  count: number;
  unlinked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Collapsible defaultOpen className="border-border/70 rounded-xl border">
      <CollapsibleTrigger className="group/trigger hover:bg-muted/50 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-colors">
        {unlinked ? (
          <Inbox className="text-muted-foreground size-4 shrink-0" />
        ) : (
          <Folder className="text-muted-foreground size-4 shrink-0" />
        )}
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{title}</span>
        <Badge variant="secondary" className="rounded text-[11px]">
          {count}
        </Badge>
        <ChevronDown className="text-muted-foreground size-4 shrink-0 transition-transform group-data-[state=open]/trigger:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-3 px-3 pt-1 pb-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

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
  const { featureRequests } = useListFeatureRequests(
    activeOrgId ? { organizationId: activeOrgId, projectId } : skipToken,
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

  // Open PRs only, newest first.
  const sorted = [...pullRequests]
    .filter((pr) => pr.state === "open")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Group PRs under their feature request ("folder"); PRs with no (project) feature
  // request fall into an Unlinked group shown last.
  const frById = new Map(featureRequests.map((fr) => [fr.id, fr]));
  const byFeature = new Map<string, Pr[]>();
  for (const pr of sorted) {
    const key =
      pr.featureRequestId && frById.has(pr.featureRequestId) ? pr.featureRequestId : UNLINKED;
    const list = byFeature.get(key);
    if (list) list.push(pr);
    else byFeature.set(key, [pr]);
  }
  // Feature-request groups in the feature list's order, then the Unlinked group.
  const groups: { key: string; title: string; unlinked?: boolean; prs: Pr[] }[] = [];
  for (const fr of featureRequests) {
    const prs = byFeature.get(fr.id);
    if (prs && prs.length) groups.push({ key: fr.id, title: fr.title, prs });
  }
  const unlinkedPrs = byFeature.get(UNLINKED);
  if (unlinkedPrs && unlinkedPrs.length) {
    groups.push({
      key: UNLINKED,
      title: "Not linked to a feature request",
      unlinked: true,
      prs: unlinkedPrs,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Pull Requests</h2>
          <p className="text-muted-foreground text-sm">
            Open PRs grouped by the feature request they implement, with their AI review.
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
      ) : groups.length === 0 ? (
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
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <FeatureGroup
              key={group.key}
              title={group.title}
              count={group.prs.length}
              unlinked={group.unlinked}
            >
              {group.prs.map((pr) => (
                <PrRow key={pr.id} pr={pr} projectId={projectId} />
              ))}
            </FeatureGroup>
          ))}
        </div>
      )}
    </div>
  );
}
