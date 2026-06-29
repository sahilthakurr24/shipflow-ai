"use client";

import Link from "next/link";
import { skipToken } from "@tanstack/react-query";
import { Building2, ChevronRight, FolderGit2, Lock } from "lucide-react";

import { ConnectGithubButton, ConnectGithubCard } from "~/components/github/connect-github";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { useGetGithubInstallUrl, useListRepositories } from "~/hooks/api/repository";
import { useOrganization } from "~/providers/organization";

export default function RepositoriesPage() {
  const { activeOrgId, activeOrg } = useOrganization();

  const { repositories, isLoading, error } = useListRepositories(
    activeOrgId ? { organizationId: activeOrgId } : skipToken,
  );
  const { url: installUrl } = useGetGithubInstallUrl(
    activeOrgId ? { organizationId: activeOrgId } : skipToken,
  );
  const isError = Boolean(error);

  if (!activeOrgId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <Building2 className="text-muted-foreground size-6" />
          <p className="text-muted-foreground text-sm">
            Create or select an organization to connect repositories.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Repositories</h2>
          <p className="text-muted-foreground text-sm">
            GitHub repositories connected to {activeOrg?.name}.
          </p>
        </div>
        {!isLoading && repositories.length > 0 ? (
          <ConnectGithubButton url={installUrl} label="Add repositories" variant="outline" />
        ) : null}
      </header>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="text-destructive py-10 text-center text-sm">
            Couldn&apos;t load repositories. Please try again.
          </CardContent>
        </Card>
      ) : repositories.length === 0 ? (
        <ConnectGithubCard
          url={installUrl}
          title="No repositories connected"
          description="Install the ShipFlow GitHub App on the repositories you want it to review and ship."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {repositories.map((repo) => {
            const card = (
              <Card className="hover:border-foreground/20 h-full transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-start gap-3">
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
            );

            return (
              <Link
                key={repo.id}
                href={`/dashboard/repositories/${repo.id}`}
                aria-label={`Open ${repo.fullName}`}
                className="group focus-visible:ring-ring block rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {card}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
