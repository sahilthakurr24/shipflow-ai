"use client";

import * as React from "react";
import { skipToken } from "@tanstack/react-query";
import {
  Check,
  GitCommitHorizontal,
  Loader2,
  RefreshCw,
  ScanSearch,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useRequestReview } from "~/hooks/api/pull-request";
import { useUpdateReviewIssueStatus } from "~/hooks/api/review";
import { cn } from "~/lib/utils";
import { trpc } from "~/trpc/client";
import { commitUrl, type Review, type ReviewIssue, shortSha, VerdictBadge } from "./shared";

const RUNNING = new Set(["queued", "running"]);
const REVIEW_STEPS = [
  "Reading the changed files…",
  "Comparing the diff against the PRD goals and non-goals…",
  "Checking the change against each acceptance criterion…",
  "Scanning for correctness, edge-case and security issues…",
  "Writing up the findings…",
] as const;
const ISSUE_STATUSES = ["open", "resolved", "wont_fix", "ignored"] as const;
const ISSUE_STATUS_LABEL: Record<string, string> = {
  open: "Open",
  resolved: "Resolved",
  wont_fix: "Won't fix",
  ignored: "Ignored",
};

function IssueRow({ issue }: { issue: ReviewIssue }) {
  const { updateReviewIssueStatusAsync } = useUpdateReviewIssueStatus();
  const blocking = issue.severity === "blocking";
  const muted = issue.status !== "open";

  async function setStatus(status: (typeof ISSUE_STATUSES)[number]) {
    try {
      await updateReviewIssueStatusAsync({ id: issue.id, status });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update issue");
    }
  }

  return (
    <div className={cn("rounded-lg border p-3", muted && "opacity-60")}>
      <div className="flex items-start gap-2">
        <TriangleAlert
          className={cn("mt-0.5 size-4 shrink-0", blocking ? "text-red-500" : "text-amber-500")}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className={cn(
                "h-5 rounded px-1.5 text-[11px]",
                blocking
                  ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
              )}
            >
              {blocking ? "Blocking" : "Non-blocking"}
            </Badge>
            <Badge variant="secondary" className="h-5 rounded px-1.5 text-[11px] capitalize">
              {issue.category.replace(/_/g, " ")}
            </Badge>
            <span className="text-sm font-medium">{issue.title}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{issue.description}</p>
          {issue.filePath ? (
            <p className="text-muted-foreground/80 mt-1 font-mono text-xs">
              {issue.filePath}
              {issue.lineStart != null ? `:${issue.lineStart}` : ""}
            </p>
          ) : null}
          {issue.suggestion ? (
            <p className="mt-1.5 text-sm">
              <span className="text-muted-foreground">Fix: </span>
              {issue.suggestion}
            </p>
          ) : null}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 shrink-0 text-xs">
              {ISSUE_STATUS_LABEL[issue.status] ?? issue.status}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {ISSUE_STATUSES.map((s) => (
              <DropdownMenuItem key={s} onClick={() => void setStatus(s)}>
                {ISSUE_STATUS_LABEL[s]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function ReviewingState({ queued }: { queued: boolean }) {
  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setStep((p) => (p + 1) % REVIEW_STEPS.length), 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <Loader2 className="text-muted-foreground size-6 animate-spin" />
      <div className="space-y-1">
        <p className="text-sm font-medium">
          {queued ? "Queued for review…" : "Reviewing your code…"}
        </p>
        <p className="text-muted-foreground text-sm" aria-live="polite">
          {queued ? "Starting the AI reviewer." : REVIEW_STEPS[step]}
        </p>
      </div>
      <p className="text-muted-foreground/70 max-w-sm text-xs leading-relaxed">
        This usually takes under a minute. The AI review can make mistakes — treat it as a first
        pass, not a replacement for human judgement.
      </p>
    </div>
  );
}

function ReviewDisclaimer() {
  return (
    <p className="text-muted-foreground/60 flex items-start gap-1.5 border-t pt-3 text-xs leading-relaxed">
      <TriangleAlert className="mt-0.5 size-3 shrink-0" />
      AI-generated review — it can be incomplete or wrong. A human still approves before this ships.
    </p>
  );
}

export function PrReview({
  organizationId,
  pullRequestId,
  headSha,
  prHtmlUrl,
  onReviewLoaded,
}: {
  organizationId: string;
  pullRequestId: string;
  headSha?: string | null;
  prHtmlUrl?: string | null;
  onReviewLoaded?: (review: Review | undefined) => void;
}) {
  // We requested a review and are waiting for Inngest to create + finish the new
  // review row. The row is created asynchronously, so right after the request the
  // latest review is still the OLD completed one — we must keep polling and show
  // the reviewing state until a newer review appears and completes.
  const [awaiting, setAwaiting] = React.useState(false);
  const prevReviewIdRef = React.useRef<string | undefined>(undefined);

  const reviewsQuery = trpc.review.listReviews.useQuery(
    { organizationId, pullRequestId },
    {
      refetchInterval: (q) => {
        const latest = [...(q.state.data?.reviews ?? [])].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0];
        if (latest && RUNNING.has(latest.status)) return 2000;
        // Keep polling while we wait for the freshly-requested review to appear.
        if (awaiting) return 2000;
        return false;
      },
    },
  );
  const review = [...(reviewsQuery.data?.reviews ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];

  React.useEffect(() => onReviewLoaded?.(review), [review, onReviewLoaded]);

  const issuesQuery = trpc.review.listReviewIssues.useQuery(
    review ? { reviewId: review.id } : skipToken,
  );
  const issues = [...(issuesQuery.data?.issues ?? [])].sort(
    (a, b) => (a.severity === "blocking" ? 0 : 1) - (b.severity === "blocking" ? 0 : 1),
  );

  const { requestReviewAsync, isPending: isRerunning } = useRequestReview();
  const isRunning = review ? RUNNING.has(review.status) : false;
  // Covers the whole in-flight window: the request, the wait for the new row, and
  // the queued/running review. The action button stays disabled the entire time so
  // a review can't be re-triggered mid-run.
  const reviewing = isRunning || isRerunning || awaiting;

  // The exact commit this review evaluated, and whether the PR has moved past it.
  const reviewedSha = review?.reviewedSha ?? null;
  const isStale =
    !reviewing &&
    review?.status === "completed" &&
    reviewedSha != null &&
    headSha != null &&
    reviewedSha !== headSha;

  // Stop awaiting once a brand-new review has finished running.
  React.useEffect(() => {
    if (!awaiting || !review) return;
    if (review.id !== prevReviewIdRef.current && !RUNNING.has(review.status)) {
      setAwaiting(false);
    }
  }, [awaiting, review]);

  // Safety net: never spin forever if the review never materializes.
  React.useEffect(() => {
    if (!awaiting) return;
    const t = setTimeout(() => setAwaiting(false), 120000);
    return () => clearTimeout(t);
  }, [awaiting]);

  async function rerun() {
    prevReviewIdRef.current = review?.id;
    setAwaiting(true);
    try {
      await requestReviewAsync({ id: pullRequestId });
      toast.success("AI review requested");
      await reviewsQuery.refetch();
    } catch (error) {
      setAwaiting(false);
      toast.error(error instanceof Error ? error.message : "Failed to request review");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ScanSearch className="size-4" />
          AI Review
          {review?.verdict && !reviewing ? <VerdictBadge verdict={review.verdict} /> : null}
          {review && review.attempt > 1 && !reviewing ? (
            <Badge variant="outline" className="rounded text-[11px] font-normal">
              Attempt #{review.attempt}
            </Badge>
          ) : null}
          {reviewing ? (
            <Badge variant="secondary" className="gap-1">
              <Loader2 className="size-3 animate-spin" />
              {review?.status === "queued" || (isRerunning && !isRunning) ? "Queued" : "Reviewing"}
            </Badge>
          ) : null}
        </CardTitle>
        <Button variant="outline" size="sm" onClick={rerun} disabled={reviewing}>
          {reviewing ? <Loader2 className="animate-spin" /> : <RefreshCw className="size-4" />}
          {reviewing ? "Reviewing…" : review ? "Re-run" : "Run AI review"}
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isStale ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <p>
              <span className="font-medium">New commits since this review.</span> This review ran
              against an older commit — re-run to review the latest code.
            </p>
          </div>
        ) : null}
        {reviewing ? (
          <ReviewingState queued={review?.status === "queued" || (isRerunning && !isRunning)} />
        ) : !review ? (
          <p className="text-muted-foreground/70 text-sm italic">
            No review yet. Run the AI review to check this diff against the PRD.
          </p>
        ) : (
          <>
            {review.readinessScore != null ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Readiness</span>
                <span className="font-semibold">{review.readinessScore}/100</span>
                <span className="text-muted-foreground">
                  · {review.blockingCount} blocking · {review.nonBlockingCount} non-blocking
                </span>
              </div>
            ) : null}

            {review.summary ? <p className="text-sm leading-relaxed">{review.summary}</p> : null}

            {issues.length ? (
              <div className="flex flex-col gap-2">
                {issues.map((issue) => (
                  <IssueRow key={issue.id} issue={issue} />
                ))}
              </div>
            ) : review.status === "completed" ? (
              <p className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                <Check className="size-4" />
                No issues found.
              </p>
            ) : null}

            {review.status === "completed" && reviewedSha ? (
              <div className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs">
                <GitCommitHorizontal className="size-3.5 shrink-0" />
                <span>Reviewed commit</span>
                {(() => {
                  const url = commitUrl(prHtmlUrl, reviewedSha);
                  const sha = shortSha(reviewedSha);
                  return url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-foreground font-mono underline-offset-2 hover:underline"
                    >
                      {sha}
                    </a>
                  ) : (
                    <span className="font-mono">{sha}</span>
                  );
                })()}
                {review.model ? <span>· {review.model}</span> : null}
              </div>
            ) : null}

            {review.status === "completed" ? <ReviewDisclaimer /> : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
