"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { skipToken } from "@tanstack/react-query";
import { ChevronRight, Loader2, ScanSearch, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { RouterOutputs } from "@repo/trpc/client";

import { VerdictBadge, timeAgo } from "~/components/pull-request/shared";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { useDeleteReview } from "~/hooks/api/review";
import { useListRepositories } from "~/hooks/api/repository";
import { useOrganization } from "~/providers/organization";
import { trpc } from "~/trpc/client";

type Review = RouterOutputs["review"]["listReviews"]["reviews"][number];
type Pr = RouterOutputs["pullRequest"]["listPullRequests"]["pullRequests"][number];

function ReviewRow({ review, pr, projectId }: { review: Review; pr?: Pr; projectId: string }) {
  const { deleteReviewAsync, isPending } = useDeleteReview();

  async function handleDelete() {
    try {
      await deleteReviewAsync({ id: review.id });
      toast.success("Review deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete review");
    }
  }

  return (
    <Card className="group hover:border-foreground/20 relative transition-all hover:shadow-md">
      {/* Link overlay — the whole card navigates; interactive controls sit above it. */}
      <Link
        href={`/dashboard/projects/${projectId}/pull-requests/${review.pullRequestId}`}
        aria-label={pr ? `Open ${pr.title}` : "Open pull request"}
        className="focus-visible:ring-ring absolute inset-0 z-0 rounded-xl focus-visible:ring-2 focus-visible:outline-none"
      />
      <CardHeader className="flex flex-row items-center gap-3">
        <ScanSearch className="text-muted-foreground size-5 shrink-0" />
        <div className="grid min-w-0 flex-1 gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium">{pr ? pr.title : "Pull request"}</span>
            {pr ? <span className="text-muted-foreground text-xs">#{pr.githubPrNumber}</span> : null}
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

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete review"
              disabled={isPending}
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:text-destructive relative z-10 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this review?</AlertDialogTitle>
              <AlertDialogDescription>
                This AI review record{pr ? ` for “${pr.title}”` : ""} will be permanently removed.
                This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={(e) => {
                  e.preventDefault();
                  void handleDelete();
                }}
                disabled={isPending}
              >
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

export default function ProjectReviewsPage() {
  const { activeOrgId } = useOrganization();
  const projectId = useParams<{ id: string }>().id;

  const { repositories } = useListRepositories(
    activeOrgId ? { organizationId: activeOrgId } : skipToken,
  );
  const repoId = repositories.find((r) => r.projectId === projectId)?.id;

  const scoped =
    activeOrgId && repoId ? { organizationId: activeOrgId, repositoryId: repoId } : undefined;

  // The global default is staleTime: Infinity, so without overrides this list
  // would serve a stale cache forever. Force it fresh: refetch on every mount and
  // poll while open, so server-created reviews (made by Inngest, no client
  // mutation to invalidate) always show up.
  const reviewsQuery = trpc.review.listReviews.useQuery(scoped ?? skipToken, {
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 4000,
  });
  const prsQuery = trpc.pullRequest.listPullRequests.useQuery(scoped ?? skipToken, {
    staleTime: 0,
    refetchOnMount: "always",
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
          {sorted.map((review) => (
            <ReviewRow
              key={review.id}
              review={review}
              pr={prById.get(review.pullRequestId)}
              projectId={projectId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
