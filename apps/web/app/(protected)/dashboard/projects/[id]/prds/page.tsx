"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { skipToken } from "@tanstack/react-query";
import { Check, ChevronRight, FileText } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { useListPrds } from "~/hooks/api/prd";
import { useOrganization } from "~/providers/organization";

export default function PrdsPage() {
  const { activeOrgId } = useOrganization();
  const projectId = useParams<{ id: string }>().id;
  const { prds, isLoading, error } = useListPrds(
    activeOrgId ? { organizationId: activeOrgId, projectId } : skipToken,
  );
  const isError = Boolean(error);

  const sorted = [...prds].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">PRDs</h2>
        <p className="text-muted-foreground text-sm">
          Product requirement documents generated from your feature requests.
        </p>
      </header>

      {!activeOrgId ? (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center text-sm">
            Select an organization first.
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="text-destructive py-10 text-center text-sm">
            Couldn&apos;t load PRDs.
          </CardContent>
        </Card>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <FileText className="text-muted-foreground size-6" />
            <p className="text-muted-foreground text-sm">No PRDs yet.</p>
            <p className="text-muted-foreground/70 text-xs">
              Create a feature request and approve its clarification to generate a PRD.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((prd) => (
            <Link
              key={prd.id}
              href={`/dashboard/projects/${projectId}/prds/${prd.id}`}
              className="group focus-visible:ring-ring block rounded-xl focus-visible:ring-2 focus-visible:outline-none"
            >
              <Card className="hover:border-foreground/20 transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-center gap-3">
                  <FileText className="text-muted-foreground size-5 shrink-0" />
                  <div className="grid min-w-0 flex-1 gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium">{prd.title}</span>
                      <Badge variant="outline">v{prd.version}</Badge>
                      {prd.approvedAt ? (
                        <Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600">
                          <Check className="size-3" />
                          Approved
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="capitalize">
                          {prd.status.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </div>
                    {prd.problemStatement ? (
                      <span className="text-muted-foreground line-clamp-1 text-xs">
                        {prd.problemStatement}
                      </span>
                    ) : null}
                  </div>
                  <ChevronRight className="text-muted-foreground group-hover:text-foreground size-4 shrink-0 transition-colors" />
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
