"use client";

import * as React from "react";
import Link from "next/link";
import { skipToken } from "@tanstack/react-query";
import { Check, Loader2, Rocket, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { useDecideApproval, useListApprovals } from "~/hooks/api/approval";
import { cn } from "~/lib/utils";
import { type PullRequest, timeAgo } from "./shared";

const DECISION_META: Record<string, { label: string; className: string }> = {
  approved: { label: "Approved", className: "bg-emerald-600 text-white hover:bg-emerald-600" },
  changes_requested: {
    label: "Changes requested",
    className: "bg-amber-500 text-white hover:bg-amber-500",
  },
  rejected: { label: "Rejected", className: "bg-red-600 text-white hover:bg-red-600" },
};

export function PrApproval({
  pullRequest,
  organizationId,
  projectId,
}: {
  pullRequest: PullRequest;
  organizationId: string;
  projectId: string;
}) {
  const featureRequestId = pullRequest.featureRequestId ?? undefined;

  const { approvals } = useListApprovals(
    featureRequestId ? { organizationId, featureRequestId } : skipToken,
  );
  const { decideApprovalAsync, isPending: isApproving } = useDecideApproval();

  const [notes, setNotes] = React.useState("");

  async function decide(decision: "approved" | "changes_requested" | "rejected") {
    if (!featureRequestId) return;
    try {
      // decide (not createApproval) so the feature's lifecycle status advances too.
      await decideApprovalAsync({
        organizationId,
        featureRequestId,
        decision,
        notes: notes.trim() || undefined,
      });
      setNotes("");
      toast.success(
        decision === "approved"
          ? "Approved"
          : decision === "rejected"
            ? "Rejected"
            : "Changes requested",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to record decision");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Human approval</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {featureRequestId ? (
          <>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Approval notes (optional)…"
              rows={2}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => decide("approved")}
                disabled={isApproving}
                className="bg-emerald-600 text-white hover:bg-emerald-600/90"
              >
                {isApproving ? <Loader2 className="animate-spin" /> : <Check className="size-4" />}
                Approve
              </Button>
              <Button
                variant="outline"
                onClick={() => decide("changes_requested")}
                disabled={isApproving}
              >
                Request changes
              </Button>
              <Button
                variant="outline"
                onClick={() => decide("rejected")}
                disabled={isApproving}
                className="text-red-600 hover:text-red-600 dark:text-red-400"
              >
                <X className="size-4" />
                Reject
              </Button>
            </div>
            {/* Approving records the decision; shipping is gated and happens on the
                feature's Review & Ship page. */}
            <Button asChild variant="outline" className="self-start">
              <Link
                href={`/dashboard/projects/${projectId}/feature-requests/${featureRequestId}/review`}
              >
                <Rocket className="size-4" />
                Review &amp; Ship
              </Link>
            </Button>
          </>
        ) : (
          <p className="text-muted-foreground/70 text-sm italic">
            Link a feature request above to approve this pull request.
          </p>
        )}

        {approvals.length ? (
          <div className="flex flex-col gap-2 border-t pt-3">
            <Label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              History
            </Label>
            {approvals.map((a) => {
              const meta = DECISION_META[a.decision];
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
  );
}
