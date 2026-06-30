"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { skipToken } from "@tanstack/react-query";
import { ChevronRight, FolderGit2, Lock } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { useListRepositories } from "~/hooks/api/repository";
import { useOrganization } from "~/providers/organization";

export default function ProjectRepositoryPage() {
  const { activeOrgId } = useOrganization();
  const projectId = useParams<{ id: string }>().id;
  const { repositories, isLoading } = useListRepositories(
    activeOrgId ? { organizationId: activeOrgId } : skipToken,
  );
  const repo = repositories.find((r) => r.projectId === projectId);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">Repository</h2>
        <p className="text-muted-foreground text-sm">The repository this project is connected to.</p>
      </header>

      {isLoading ? (
        <Skeleton className="h-24 rounded-xl" />
      ) : !repo ? (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center text-sm">
            No repository connected to this project.
          </CardContent>
        </Card>
      ) : (
        <Link
          href={`/dashboard/repositories/${repo.id}`}
          className="group focus-visible:ring-ring block rounded-xl focus-visible:ring-2 focus-visible:outline-none"
        >
          <Card className="hover:border-foreground/20 transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="bg-muted flex size-9 items-center justify-center rounded-lg">
                <FolderGit2 className="size-4" />
              </div>
              <div className="grid min-w-0 flex-1 gap-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{repo.fullName}</span>
                  {repo.isPrivate ? (
                    <Badge variant="secondary" className="gap-1">
                      <Lock className="size-3" />
                      Private
                    </Badge>
                  ) : (
                    <Badge variant="outline">Public</Badge>
                  )}
                </div>
                <span className="text-muted-foreground truncate text-xs">
                  default branch: {repo.defaultBranch}
                </span>
              </div>
              <ChevronRight className="text-muted-foreground group-hover:text-foreground size-4 shrink-0 transition-colors" />
            </CardHeader>
          </Card>
        </Link>
      )}
    </div>
  );
}
