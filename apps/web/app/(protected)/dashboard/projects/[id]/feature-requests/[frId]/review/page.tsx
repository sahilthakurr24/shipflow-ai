"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { skipToken } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  CircleAlert,
  GitPullRequest,
  ListChecks,
  Loader2,
  Rocket,
  TriangleAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { RouterOutputs } from "@repo/trpc/client";

import { PrdSection } from "~/components/feature-request/prd-section";
import { FeatureStatusBadge } from "~/components/feature-request/status-badge";
import { shortSha, timeAgo, VerdictBadge } from "~/components/pull-request/shared";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import { Textarea } from "~/components/ui/textarea";
import { useDecideApproval, useListApprovals } from "~/hooks/api/approval";
import { useGetFeatureRequestById } from "~/hooks/api/feature-request";
import { useShipRelease } from "~/hooks/api/release";
import { useListTasks } from "~/hooks/api/task";
import { useOrganization } from "~/providers/organization";
import { cn } from "~/lib/utils";
import { trpc } from "~/trpc/client";

type Review = RouterOutputs["review"]["listReviews"]["reviews"][number];
type Issue = RouterOutputs["review"]["listOutstandingIssues"]["issues"][number];
type Task = RouterOutputs["task"]["listTasks"]["tasks"][number];
type Pr = RouterOutputs["pullRequest"]["listPullRequests"]["pullRequests"][number];
type Approval = RouterOutputs["approval"]["listApprovals"]["approvals"][number];

const APPROVAL_DECISION_META: Record<string, { label: string; className: string }> = {
  approved: { label: "Approved", className: "bg-emerald-600 text-white hover:bg-emerald-600" },
  changes_requested: {
    label: "Changes requested",
    className: "bg-amber-500 text-white hover:bg-amber-500",
  },
  rejected: { label: "Rejected", className: "bg-red-600 text-white hover:bg-red-600" },
};

function SectionCard({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: React.ElementType;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4" />
          {title}
          {count != null ? (
            <span className="text-muted-foreground text-sm font-normal">({count})</span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function FeatureReviewPage() {
  const params = useParams<{ id: string; frId: string }>();
  const projectId = params.id;
  const frId = params.frId;
  const { activeOrgId } = useOrganization();

  const { featureRequest, isLoading } = useGetFeatureRequestById({ id: frId });
  const organizationId = featureRequest?.organizationId ?? activeOrgId ?? "";
  const scoped = organizationId ? { organizationId, featureRequestId: frId } : undefined;

  const { tasks } = useListTasks(scoped ?? skipToken);
  const reviewsQuery = trpc.review.listReviews.useQuery(scoped ?? skipToken);
  const outstandingQuery = trpc.review.listOutstandingIssues.useQuery(scoped ?? skipToken);
  const prsQuery = trpc.pullRequest.listPullRequests.useQuery(
    organizationId ? { organizationId } : skipToken,
  );
  const { approvals } = useListApprovals(scoped ?? skipToken);

  const { decideApprovalAsync, isPending: isDeciding } = useDecideApproval();
  const { shipReleaseAsync, isPending: isShipping } = useShipRelease();

  const [notes, setNotes] = React.useState("");

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!featureRequest) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <p className="text-muted-foreground text-sm">Feature request not found.</p>
      </div>
    );
  }

  const reviews: Review[] = [...(reviewsQuery.data?.reviews ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const outstanding: Issue[] = outstandingQuery.data?.issues ?? [];
  const outstandingCount = outstandingQuery.data?.count ?? 0;
  const prs: Pr[] = (prsQuery.data?.pullRequests ?? []).filter(
    (pr) => pr.featureRequestId === frId,
  );
  const sortedApprovals: Approval[] = [...approvals].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const latestApproval = sortedApprovals[0];
  const latestReviewId = reviews[0]?.id;

  const isApproved = latestApproval?.decision === "approved";
  const isShipped = featureRequest.status === "shipped";
  const canShip = isApproved && outstandingCount === 0 && !isShipped;
  const shipBlockedReason = isShipped
    ? "This feature has already shipped."
    : !isApproved
      ? "Approve the feature before it can ship."
      : outstandingCount > 0
        ? `${outstandingCount} blocking ${outstandingCount === 1 ? "issue" : "issues"} must be resolved first.`
        : null;

  async function decide(decision: "approved" | "changes_requested" | "rejected") {
    if (!organizationId) return;
    try {
      await decideApprovalAsync({
        organizationId,
        featureRequestId: frId,
        decision,
        reviewId: latestReviewId,
        notes: notes.trim() || undefined,
      });
      setNotes("");
      toast.success(
        decision === "approved"
          ? "Feature approved"
          : decision === "rejected"
            ? "Feature rejected"
            : "Changes requested",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to record decision");
    }
  }

  async function ship() {
    if (!organizationId) return;
    try {
      await shipReleaseAsync({
        organizationId,
        featureRequestId: frId,
        pullRequestId: prs[0]?.id,
      });
      toast.success("Feature shipped 🚀");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to ship");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Link
        href={`/dashboard/projects/${projectId}/feature-requests/${frId}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to feature request
      </Link>

      {/* Header */}
      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
            <span>{featureRequest.title}</span>
            <FeatureStatusBadge status={featureRequest.status} />
          </CardTitle>
          {featureRequest.description ? (
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">
              {featureRequest.description}
            </p>
          ) : null}
        </CardHeader>
      </Card>

      {/* PRD */}
      <PrdSection featureRequestId={frId} projectId={projectId} status={featureRequest.status} />

      {/* Tasks */}
      <SectionCard title="Tasks" icon={ListChecks} count={tasks.length}>
        {tasks.length ? (
          <ul className="flex flex-col gap-1.5">
            {tasks.map((task: Task) => (
              <li key={task.id} className="flex items-center gap-2 text-sm">
                <Badge
                  variant="secondary"
                  className="h-5 shrink-0 rounded px-1.5 text-[11px] capitalize"
                >
                  {task.status.replace(/_/g, " ")}
                </Badge>
                <span className="truncate">{task.title}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground/70 text-sm italic">No tasks for this feature.</p>
        )}
      </SectionCard>

      {/* Pull requests & AI review history */}
      <SectionCard title="Pull requests & AI reviews" icon={GitPullRequest} count={prs.length}>
        {prs.length ? (
          <div className="flex flex-col gap-2">
            {prs.map((pr) => (
              <Link
                key={pr.id}
                href={`/dashboard/projects/${projectId}/pull-requests/${pr.id}`}
                className="hover:border-foreground/20 flex items-center gap-2 rounded-lg border p-2.5 text-sm transition-colors"
              >
                <GitPullRequest className="text-muted-foreground size-4 shrink-0" />
                <span className="truncate font-medium">{pr.title}</span>
                <span className="text-muted-foreground text-xs">#{pr.githubPrNumber}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground/70 text-sm italic">
            No pull request is linked to this feature yet.
          </p>
        )}

        {reviews.length ? (
          <div className="mt-4 flex flex-col gap-2 border-t pt-3">
            <Label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Review history
            </Label>
            {reviews.map((review) => (
              <div key={review.id} className="flex flex-wrap items-center gap-2 text-xs">
                {review.verdict ? <VerdictBadge verdict={review.verdict} /> : null}
                <span className="text-muted-foreground">Attempt #{review.attempt}</span>
                {review.reviewedSha ? (
                  <span className="text-muted-foreground font-mono">
                    {shortSha(review.reviewedSha)}
                  </span>
                ) : null}
                <span className="text-muted-foreground">
                  · {review.blockingCount} blocking · {timeAgo(review.createdAt)}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </SectionCard>

      {/* Outstanding blocking issues */}
      <SectionCard title="Outstanding blocking issues" icon={CircleAlert} count={outstandingCount}>
        {outstanding.length ? (
          <div className="flex flex-col gap-2">
            {outstanding.map((issue: Issue) => (
              <div key={issue.id} className="flex items-start gap-2 rounded-lg border p-2.5">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-500" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{issue.title}</p>
                  {issue.filePath ? (
                    <p className="text-muted-foreground/80 font-mono text-xs">
                      {issue.filePath}
                      {issue.lineStart != null ? `:${issue.lineStart}` : ""}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
            <Check className="size-4" />
            No unresolved blocking issues.
          </p>
        )}
      </SectionCard>

      {/* Decision & ship */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Human decision &amp; ship</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Decision notes (optional)…"
            rows={2}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => decide("approved")}
              disabled={isDeciding || isShipped}
              className="bg-emerald-600 text-white hover:bg-emerald-600/90"
            >
              {isDeciding ? <Loader2 className="animate-spin" /> : <Check className="size-4" />}
              Approve
            </Button>
            <Button
              variant="outline"
              onClick={() => decide("changes_requested")}
              disabled={isDeciding}
            >
              Request changes
            </Button>
            <Button
              variant="outline"
              onClick={() => decide("rejected")}
              disabled={isDeciding}
              className="text-red-600 hover:text-red-600 dark:text-red-400"
            >
              <X className="size-4" />
              Reject
            </Button>
          </div>

          <div className="flex flex-col gap-1.5 border-t pt-4">
            <Button
              onClick={ship}
              disabled={!canShip || isShipping}
              className="bg-violet-600 text-white hover:bg-violet-600/90 disabled:opacity-50"
            >
              {isShipping ? <Loader2 className="animate-spin" /> : <Rocket className="size-4" />}
              {isShipped ? "Shipped" : "Ship feature"}
            </Button>
            {shipBlockedReason && !isShipped ? (
              <p className="text-muted-foreground/80 text-xs">{shipBlockedReason}</p>
            ) : null}
          </div>

          {sortedApprovals.length ? (
            <div className="flex flex-col gap-2 border-t pt-4">
              <Label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Decision history
              </Label>
              {sortedApprovals.map((a) => {
                const meta = APPROVAL_DECISION_META[a.decision];
                return (
                  <div key={a.id} className="flex items-center gap-2 text-sm">
                    <Badge className={cn("gap-1", meta?.className)}>
                      {meta?.label ?? a.decision}
                    </Badge>
                    <span className="text-muted-foreground text-xs">{timeAgo(a.createdAt)}</span>
                    {a.notes ? (
                      <span className="text-muted-foreground truncate text-xs">— {a.notes}</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
