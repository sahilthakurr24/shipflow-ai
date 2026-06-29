"use client";

import Link from "next/link";
import { skipToken } from "@tanstack/react-query";
import { ChevronRight, GitPullRequest } from "lucide-react";

import { PrStateBadge, timeAgo } from "~/components/pull-request/shared";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { useListPullRequests } from "~/hooks/api/pull-request";
import { useOrganization } from "~/providers/organization";

export default function PullRequestsPage() {
  const { activeOrgId } = useOrganization();
  const { pullRequests, isLoading, error } = useListPullRequests(
    activeOrgId ? { organizationId: activeOrgId } : skipToken,
  );
  const isError = Boolean(error);

  const sorted = [...pullRequests].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">Pull Requests</h2>
        <p className="text-muted-foreground text-sm">
          PRs from your connected repositories, with their AI review.
        </p>
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
            <GitPullRequest className="text-muted-foreground size-6" />
            <p className="font-medium">No pull requests yet</p>
            <p className="text-muted-foreground max-w-sm text-sm">
              Open a PR on a connected GitHub repository and it&apos;ll appear here for AI review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((pr) => (
            <Link
              key={pr.id}
              href={`/dashboard/pull-requests/${pr.id}`}
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
