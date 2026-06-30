"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { skipToken } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, GitPullRequest } from "lucide-react";

import { PrApproval } from "~/components/pull-request/pr-approval";
import { PrFiles } from "~/components/pull-request/pr-files";
import { PrReview } from "~/components/pull-request/pr-review";
import { PrStateBadge, type Review } from "~/components/pull-request/shared";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { useGetPullRequestById, useListPullRequestFiles } from "~/hooks/api/pull-request";

export default function PullRequestDetailPage() {
  const params = useParams<{ id: string; prId: string }>();
  const projectId = params.id;
  const id = params.prId;

  const { pullRequest, isLoading, refetch } = useGetPullRequestById({ id });
  const { files } = useListPullRequestFiles(pullRequest ? { pullRequestId: id } : skipToken);

  const [review, setReview] = React.useState<Review | undefined>();
  const onReviewLoaded = React.useCallback((r: Review | undefined) => setReview(r), []);

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!pullRequest) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <p className="text-muted-foreground text-sm">Pull request not found.</p>
      </div>
    );
  }

  const organizationId = pullRequest.organizationId;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Link
        href={`/dashboard/projects/${projectId}/pull-requests`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Pull Requests
      </Link>

      {/* Header */}
      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
            <GitPullRequest className="size-5 shrink-0" />
            <span>{pullRequest.title}</span>
            <span className="text-muted-foreground text-sm font-normal">
              #{pullRequest.githubPrNumber}
            </span>
            <PrStateBadge state={pullRequest.state} />
          </CardTitle>
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
            {pullRequest.authorLogin ? <span>{pullRequest.authorLogin}</span> : null}
            <span className="font-mono">
              {pullRequest.headBranch ?? "?"} → {pullRequest.baseBranch ?? "?"}
            </span>
            <span>
              <span className="text-emerald-600 dark:text-emerald-400">+{pullRequest.additions}</span>{" "}
              <span className="text-red-600 dark:text-red-400">-{pullRequest.deletions}</span> ·{" "}
              {pullRequest.changedFilesCount} files
            </span>
            {pullRequest.htmlUrl ? (
              <Button asChild variant="ghost" size="sm" className="ml-auto h-7">
                <a href={pullRequest.htmlUrl} target="_blank" rel="noreferrer">
                  GitHub
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
            ) : null}
          </div>
        </CardHeader>
        {pullRequest.body ? (
          <CardContent>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">{pullRequest.body}</p>
          </CardContent>
        ) : null}
      </Card>

      {/* AI review */}
      <PrReview
        organizationId={organizationId}
        pullRequestId={id}
        onReviewLoaded={onReviewLoaded}
      />

      {/* Human approval */}
      <PrApproval
        pullRequest={pullRequest}
        organizationId={organizationId}
        reviewId={review?.id}
        onLinked={() => void refetch()}
      />

      {/* Files / diff */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Changed files ({files.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <PrFiles files={files} />
        </CardContent>
      </Card>
    </div>
  );
}
