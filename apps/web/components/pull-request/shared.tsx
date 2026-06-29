import { CircleDot, GitMerge, GitPullRequestClosed, GitPullRequestDraft } from "lucide-react";

import type { RouterOutputs } from "@repo/trpc/client";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

export type PullRequest = NonNullable<RouterOutputs["pullRequest"]["getPullRequestById"]["pullRequest"]>;
export type PullRequestFile = RouterOutputs["pullRequest"]["listPullRequestFiles"]["files"][number];
export type Review = RouterOutputs["review"]["listReviews"]["reviews"][number];
export type ReviewIssue = RouterOutputs["review"]["listReviewIssues"]["issues"][number];
export type Approval = RouterOutputs["approval"]["listApprovals"]["approvals"][number];

export type PrState = PullRequest["state"];
export type Verdict = NonNullable<Review["verdict"]>;

const PR_STATE_META: Record<PrState, { label: string; icon: typeof CircleDot; className: string }> = {
  open: { label: "Open", icon: CircleDot, className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  merged: { label: "Merged", icon: GitMerge, className: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  closed: { label: "Closed", icon: GitPullRequestClosed, className: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400" },
  draft: { label: "Draft", icon: GitPullRequestDraft, className: "border-zinc-400/30 bg-zinc-400/10 text-zinc-500 dark:text-zinc-400" },
};

export function PrStateBadge({ state }: { state: PrState }) {
  const meta = PR_STATE_META[state] ?? PR_STATE_META.open;
  const Icon = meta.icon;
  return (
    <Badge variant="outline" className={cn("gap-1 rounded-md", meta.className)}>
      <Icon className="size-3" />
      {meta.label}
    </Badge>
  );
}

const VERDICT_META: Record<Verdict, { label: string; className: string }> = {
  approved: { label: "Approved", className: "bg-emerald-600 text-white hover:bg-emerald-600" },
  changes_requested: { label: "Changes requested", className: "bg-red-600 text-white hover:bg-red-600" },
  commented: { label: "Commented", className: "bg-amber-500 text-white hover:bg-amber-500" },
  needs_human_review: { label: "Needs human review", className: "bg-zinc-500 text-white hover:bg-zinc-500" },
};

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const meta = VERDICT_META[verdict];
  return <Badge className={cn("gap-1", meta.className)}>{meta.label}</Badge>;
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
