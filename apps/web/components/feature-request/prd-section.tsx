"use client";

import * as React from "react";
import Link from "next/link";
import { skipToken } from "@tanstack/react-query";
import { ArrowUpRight, Check, FileText, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  useApprovePrd,
  useListAcceptanceCriteria,
  useListUserStories,
} from "~/hooks/api/prd";
import { useOrganization } from "~/providers/organization";
import { trpc } from "~/trpc/client";

// While drafting, the chat panel already shows a "Generating PRD" indicator, so
// this section stays hidden until the PRD actually exists.
const PRE_PRD_STATUSES = new Set(["intake", "clarifying", "prd_drafting"]);
const REJECTED_STATUSES = new Set(["rejected", "duplicate"]);

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
      {children}
    </h4>
  );
}

function BulletList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <SectionHeading>{title}</SectionHeading>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function PrdSection({
  featureRequestId,
  status,
}: {
  featureRequestId: string;
  status?: string;
}) {
  const { activeOrgId } = useOrganization();
  const isRejected = status ? REJECTED_STATUSES.has(status) : false;
  const isPrePrd = status ? PRE_PRD_STATUSES.has(status) : true;

  // Poll for the PRD until it's generated (the prd-generation function is async).
  const prdQuery = trpc.prd.listPrds.useQuery(
    activeOrgId ? { organizationId: activeOrgId, featureRequestId } : skipToken,
    { refetchInterval: (q) => (!q.state.data?.prds?.length && !isRejected ? 5000 : false) },
  );
  const prd = [...(prdQuery.data?.prds ?? [])].sort((a, b) => b.version - a.version)[0];

  const { userStories } = useListUserStories(prd ? { prdId: prd.id } : skipToken);
  const { acceptanceCriteria } = useListAcceptanceCriteria(prd ? { prdId: prd.id } : skipToken);
  const { approvePrdAsync, isPending } = useApprovePrd();

  async function handleApprove() {
    if (!prd) return;
    try {
      await approvePrdAsync({ id: prd.id });
      toast.success("PRD approved — generating tasks");
      await prdQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve PRD");
    }
  }

  if (!prd) {
    // Nothing to show while still clarifying or if rejected; otherwise it's generating.
    if (isRejected || isPrePrd) return null;
    return (
      <Card>
        <CardContent className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Generating the PRD…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <FileText className="size-4" />
          PRD
          <Badge variant="outline">v{prd.version}</Badge>
          {prd.approvedAt ? (
            <Badge variant="secondary" className="gap-1">
              <Check className="size-3" />
              Approved
            </Badge>
          ) : null}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/dashboard/prds/${prd.id}?edit=1`}>
              <Pencil className="size-4" />
              Edit
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/prds/${prd.id}`}>
              Open PRD
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold">{prd.title}</h3>
          {prd.problemStatement ? (
            <p className="text-muted-foreground text-sm">{prd.problemStatement}</p>
          ) : null}
        </div>

        <BulletList title="Goals" items={prd.goals} />
        <BulletList title="Non-goals" items={prd.nonGoals} />
        <BulletList title="Edge cases" items={prd.edgeCases} />
        <BulletList title="Assumptions" items={prd.assumptions} />
        <BulletList title="Success metrics" items={prd.successMetrics} />

        {userStories.length ? (
          <div className="flex flex-col gap-2">
            <SectionHeading>User stories</SectionHeading>
            <ul className="space-y-1.5 text-sm">
              {userStories.map((story) => (
                <li key={story.id} className="text-muted-foreground">
                  <span className="text-foreground">As a {story.asA ?? "user"}</span>, I want{" "}
                  {story.iWant ?? "…"}, so that {story.soThat ?? "…"}.
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {acceptanceCriteria.length ? (
          <div className="flex flex-col gap-2">
            <SectionHeading>Acceptance criteria</SectionHeading>
            <ul className="space-y-1.5 text-sm">
              {acceptanceCriteria.map((criterion) => (
                <li key={criterion.id} className="flex gap-2">
                  <Check className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
                  <span>{criterion.description}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {prd.approvedAt ? (
          <p className="text-muted-foreground border-t pt-3 text-sm">
            Approved — engineering tasks are being generated.
          </p>
        ) : (
          <div className="border-t pt-3">
            <Button onClick={handleApprove} disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin" /> : <Check />}
              Approve PRD &amp; generate tasks
            </Button>
            <p className="text-muted-foreground mt-2 text-xs">
              Approving breaks this PRD into engineering tasks.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
