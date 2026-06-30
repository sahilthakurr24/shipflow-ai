"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { skipToken } from "@tanstack/react-query";
import { ChevronRight, ScanSearch } from "lucide-react";

import { VerdictBadge, timeAgo } from "~/components/pull-request/shared";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { useListRepositories } from "~/hooks/api/repository";
import { useOrganization } from "~/providers/organization";
import { trpc } from "~/trpc/client";

export default function ProjectReviewsPage() {
  const { activeOrgId } = useOrganization();
  const projectId = useParams<{ id: string }>().id;

  const { repositories } = useListRepositories(
    activeOrgId ? { organizationId: activeOrgId } : skipToken,
  );
  const repoId = repositories.find((r) => r.projectId === projectId)?.id;

  const scoped =
    activeOrgId && repoId ? { organizationId: activeOrgId, repositoryId: repoId } : undefined;

  // Poll so newly-created reviews (and re-run attempts) appear without a manual
  // refresh — global queries are staleTime: Infinity so they don't refetch on
  // their own.
  const reviewsQuery = trpc.review.listReviews.useQuery(scoped ?? skipToken, {
    refetchInterval: 4000,
    refetchOnWindowFocus: true,
  });
  const prsQuery = trpc.pullRequest.listPullRequests.useQuery(scoped ?? skipToken, {
    refetchInterval: 4000,
  });

  const reviews = reviewsQuery.data?.reviews ?? [];
  const isLoading = reviewsQuery.isLoading;
  const error = reviewsQuery.error;
  const pullRequests = prsQuery.data?.pullRequests ?? [];

  const prById = new Map(pullRequests.map((pr) => [pr.id, pr] as const));
  // Every review record (each attempt), newest first.
  const sorted = [...reviews].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">Reviews</h2>
        <p className="text-muted-foreground text-sm">
          AI code reviews of this project&apos;s pull requests.
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
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="text-destructive py-10 text-center text-sm">
            Couldn&apos;t load reviews.
          </CardContent>
        </Card>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <ScanSearch className="text-muted-foreground size-6" />
            <p className="font-medium">No reviews yet</p>
            <p className="text-muted-foreground max-w-sm text-sm">
              Reviews appear when a pull request in this project is reviewed by the AI.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((review) => {
            const pr = prById.get(review.pullRequestId);
            return (
              <Link
                key={review.id}
                href={`/dashboard/projects/${projectId}/pull-requests/${review.pullRequestId}`}
                className="group focus-visible:ring-ring block rounded-xl focus-visible:ring-2 focus-visible:outline-none"
              >
                <Card className="hover:border-foreground/20 transition-all hover:shadow-md">
                  <CardHeader className="flex flex-row items-center gap-3">
                    <ScanSearch className="text-muted-foreground size-5 shrink-0" />
                    <div className="grid min-w-0 flex-1 gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium">
                          {pr ? pr.title : "Pull request"}
                        </span>
                        {pr ? (
                          <span className="text-muted-foreground text-xs">#{pr.githubPrNumber}</span>
                        ) : null}
                        {review.verdict ? <VerdictBadge verdict={review.verdict} /> : null}
                        {review.status !== "completed" ? (
                          <Badge variant="secondary" className="capitalize">
                            {review.status}
                          </Badge>
                        ) : null}
                      </div>
                      <span className="text-muted-foreground line-clamp-1 text-xs">
                        {review.readinessScore != null ? `Readiness ${review.readinessScore}/100 · ` : ""}
                        {review.blockingCount} blocking · {review.nonBlockingCount} non-blocking ·{" "}
                        {timeAgo(review.createdAt)}
                      </span>
                    </div>
                    <ChevronRight className="text-muted-foreground group-hover:text-foreground size-4 shrink-0 transition-colors" />
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
