"use client";

import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useListFeatureRequests } from "~/hooks/api/feature-request";
import { useUpdatePullRequest } from "~/hooks/api/pull-request";
import { type PullRequest } from "./shared";

/**
 * The feature-request link for a PR, surfaced at the top of the PR page (above
 * the AI review) since it grounds the whole review — the AI checks the diff
 * against the linked feature's PRD, and a link is required to review & ship.
 */
export function PrFeatureLink({
  pullRequest,
  organizationId,
  onLinked,
}: {
  pullRequest: PullRequest;
  organizationId: string;
  onLinked: () => void;
}) {
  const featureRequestId = pullRequest.featureRequestId ?? undefined;
  const { featureRequests } = useListFeatureRequests({ organizationId });
  const { updatePullRequestAsync, isPending: isLinking } = useUpdatePullRequest();
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Linked feature request</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5">
        <Select value={featureRequestId} onValueChange={link} disabled={isLinking}>
          <SelectTrigger>
            <SelectValue
              placeholder={
                featureRequests.length ? "Link a feature request" : "No feature requests"
              }
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
          The AI review auto-links this PR to its PRD so it can check acceptance criteria. Change it
          here if the match is wrong — a link is also required to review &amp; ship.
        </p>
      </CardContent>
    </Card>
  );
}
