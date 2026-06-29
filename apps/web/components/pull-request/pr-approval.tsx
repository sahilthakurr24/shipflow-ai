"use client";

import * as React from "react";
import { skipToken } from "@tanstack/react-query";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { useListFeatureRequests } from "~/hooks/api/feature-request";
import { useCreateApproval, useListApprovals } from "~/hooks/api/approval";
import { useUpdatePullRequest } from "~/hooks/api/pull-request";
import { cn } from "~/lib/utils";
import { type PullRequest, timeAgo } from "./shared";

const DECISION_META: Record<string, { label: string; className: string }> = {
  approved: { label: "Approved", className: "bg-emerald-600 text-white hover:bg-emerald-600" },
  changes_requested: { label: "Changes requested", className: "bg-amber-500 text-white hover:bg-amber-500" },
  rejected: { label: "Rejected", className: "bg-red-600 text-white hover:bg-red-600" },
};

export function PrApproval({
  pullRequest,
  organizationId,
  reviewId,
  onLinked,
}: {
  pullRequest: PullRequest;
  organizationId: string;
  reviewId: string | undefined;
  onLinked: () => void;
}) {
  const featureRequestId = pullRequest.featureRequestId ?? undefined;

  const { featureRequests } = useListFeatureRequests({ organizationId });
  const { updatePullRequestAsync, isPending: isLinking } = useUpdatePullRequest();
  const { createApprovalAsync, isPending: isApproving } = useCreateApproval();
  const { approvals, refetch: refetchApprovals } = useListApprovals(
    featureRequestId ? { organizationId, featureRequestId } : skipToken,
  );

  const [notes, setNotes] = React.useState("");
  const linkedFr = featureRequests.find((f) => f.id === featureRequestId);

  async function link(value: string) {
    try {
      await updatePullRequestAsync({ id: pullRequest.id, featureRequestId: value });
      toast.success("Linked to feature request");
      onLinked();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to link");
    }
  }

  async function decide(decision: "approved" | "changes_requested") {
    if (!featureRequestId) return;
    try {
      await createApprovalAsync({
        organizationId,
        featureRequestId,
        reviewId,
        decision,
        notes: notes.trim() || undefined,
      });
      toast.success(decision === "approved" ? "Approved" : "Changes requested");
      setNotes("");
      await refetchApprovals();
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
        {/* Link feature request (grounds the review + required to approve) */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Linked feature request
          </Label>
          <Select value={featureRequestId} onValueChange={link} disabled={isLinking}>
            <SelectTrigger>
              <SelectValue
                placeholder={featureRequests.length ? "Link a feature request" : "No feature requests"}
              >
                {linkedFr?.title}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {featureRequests.map((fr) => (
                <SelectItem key={fr.id} value={fr.id}>
                  {fr.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground/70 text-xs">
            Links the PR to its PRD so the AI review checks acceptance criteria — also required to
            record an approval.
          </p>
        </div>

        {featureRequestId ? (
          <>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Approval notes (optional)…"
              rows={2}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => decide("approved")}
                disabled={isApproving}
                className="bg-emerald-600 text-white hover:bg-emerald-600/90"
              >
                {isApproving ? <Loader2 className="animate-spin" /> : <Check className="size-4" />}
                Approve
              </Button>
              <Button variant="outline" onClick={() => decide("changes_requested")} disabled={isApproving}>
                <X className="size-4" />
                Request changes
              </Button>
            </div>
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
                  <Badge className={cn("gap-1", meta?.className)}>{meta?.label ?? a.decision}</Badge>
                  <span className="text-muted-foreground text-xs">{timeAgo(a.createdAt)}</span>
                  {a.notes ? <span className="text-muted-foreground truncate text-xs">— {a.notes}</span> : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
