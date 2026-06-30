import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

/**
 * The 14 feature-request lifecycle statuses, labelled and colour-coded. Mirrors
 * the PrStateBadge pattern in components/pull-request/shared.tsx.
 */
const STATUS_META: Record<string, { label: string; className: string }> = {
  intake: {
    label: "Intake",
    className: "border-zinc-400/30 bg-zinc-400/10 text-zinc-500 dark:text-zinc-400",
  },
  clarifying: {
    label: "Clarifying",
    className: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  prd_drafting: {
    label: "Drafting PRD",
    className: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  prd_ready: {
    label: "PRD ready",
    className: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  planning: {
    label: "Planning",
    className: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  ready_for_development: {
    label: "Ready for dev",
    className: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  in_development: {
    label: "In development",
    className: "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  in_review: {
    label: "In review",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  changes_requested: {
    label: "Changes requested",
    className: "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  pending_approval: {
    label: "Pending approval",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  approved: {
    label: "Approved",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  shipped: {
    label: "Shipped",
    className: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  rejected: {
    label: "Rejected",
    className: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  },
  duplicate: {
    label: "Duplicate",
    className: "border-zinc-400/30 bg-zinc-400/10 text-zinc-500 dark:text-zinc-400",
  },
};

export function FeatureStatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? {
    label: status.replace(/_/g, " "),
    className: "border-zinc-400/30 bg-zinc-400/10 text-zinc-500 dark:text-zinc-400",
  };
  return (
    <Badge variant="outline" className={cn("rounded-md capitalize", meta.className)}>
      {meta.label}
    </Badge>
  );
}

const RELEASE_STATUS_META: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  shipped: {
    label: "Shipped",
    className: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  rolled_back: {
    label: "Rolled back",
    className: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  },
};

export function ReleaseStatusBadge({ status }: { status: string }) {
  const meta = RELEASE_STATUS_META[status] ?? {
    label: status.replace(/_/g, " "),
    className: "border-zinc-400/30 bg-zinc-400/10 text-zinc-500 dark:text-zinc-400",
  };
  return (
    <Badge variant="outline" className={cn("rounded-md", meta.className)}>
      {meta.label}
    </Badge>
  );
}
