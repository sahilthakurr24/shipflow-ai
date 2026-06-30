"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { skipToken } from "@tanstack/react-query";
import { Rocket } from "lucide-react";

import { ReleaseStatusBadge } from "~/components/feature-request/status-badge";
import { timeAgo } from "~/components/pull-request/shared";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { useListFeatureRequests } from "~/hooks/api/feature-request";
import { useListReleases } from "~/hooks/api/release";
import { useOrganization } from "~/providers/organization";

export default function ReleasesPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const { activeOrgId } = useOrganization();

  // Releases aren't project-scoped server-side, so scope client-side via the
  // project's feature requests (same approach the Reviews page uses via repos).
  const { releases, isLoading } = useListReleases(
    activeOrgId ? { organizationId: activeOrgId } : skipToken,
  );
  const { featureRequests } = useListFeatureRequests(
    activeOrgId ? { organizationId: activeOrgId, projectId } : skipToken,
  );

  const frById = new Map(featureRequests.map((fr) => [fr.id, fr]));
  const projectReleases = releases
    .filter((r) => frById.has(r.featureRequestId))
    .sort((a, b) => {
      const at = new Date(a.shippedAt ?? a.createdAt).getTime();
      const bt = new Date(b.shippedAt ?? b.createdAt).getTime();
      return bt - at;
    });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-semibold tracking-tight">Releases</h2>
        <p className="text-muted-foreground text-sm">
          Features that have shipped — each gated on a human approval with no outstanding blocking
          issues.
        </p>
      </header>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : projectReleases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Rocket className="text-muted-foreground size-8" />
            <p className="text-sm font-medium">No releases yet</p>
            <p className="text-muted-foreground/70 max-w-sm text-sm">
              Approve a feature with no outstanding blocking issues, then ship it — it&apos;ll
              appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {projectReleases.map((release) => {
            const fr = frById.get(release.featureRequestId);
            return (
              <Card
                key={release.id}
                className="hover:border-foreground/20 transition-all hover:shadow-md"
              >
                <CardHeader className="flex flex-row items-center gap-3">
                  <Rocket className="text-muted-foreground size-5 shrink-0" />
                  <div className="grid min-w-0 flex-1 gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/dashboard/projects/${projectId}/feature-requests/${release.featureRequestId}/review`}
                        className="hover:text-foreground truncate font-medium underline-offset-2 hover:underline"
                      >
                        {fr ? fr.title : "Feature"}
                      </Link>
                      <ReleaseStatusBadge status={release.status} />
                      {release.version ? (
                        <span className="text-muted-foreground text-xs">{release.version}</span>
                      ) : null}
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {release.shippedAt
                        ? `Shipped ${timeAgo(release.shippedAt)}`
                        : `Created ${timeAgo(release.createdAt)}`}
                    </span>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
