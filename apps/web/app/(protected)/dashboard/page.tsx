"use client";

import * as React from "react";
import Link from "next/link";
import { skipToken } from "@tanstack/react-query";
import { ChevronRight, FolderGit2, FolderKanban, Plus } from "lucide-react";

import { CreateProjectDialog } from "~/components/project/create-project-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { useListProjects } from "~/hooks/api/project";
import { useListRepositories } from "~/hooks/api/repository";
import { useOrganization } from "~/providers/organization";

export default function OverviewPage() {
  const { activeOrgId, activeOrg } = useOrganization();
  const canManage = activeOrg?.role === "owner" || activeOrg?.role === "admin";
  const { projects, isLoading } = useListProjects(
    activeOrgId ? { organizationId: activeOrgId } : skipToken,
  );
  const { repositories } = useListRepositories(
    activeOrgId ? { organizationId: activeOrgId } : skipToken,
  );
  const [createOpen, setCreateOpen] = React.useState(false);

  const repoByProject = new Map(
    repositories.filter((r) => r.projectId).map((r) => [r.projectId, r.fullName] as const),
  );
  const active = projects.filter((p) => !p.isArchived);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Projects</h2>
          <p className="text-muted-foreground text-sm">
            Each project owns one repository and its feature requests, PRDs, tasks, and pull requests.
          </p>
        </div>
        {canManage ? (
          <Button onClick={() => setCreateOpen(true)} disabled={!activeOrgId}>
            <Plus className="size-4" />
            New project
          </Button>
        ) : null}
      </header>

      {!activeOrgId ? (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center text-sm">
            Select an organization first.
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : active.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FolderKanban className="text-muted-foreground size-7" />
            <p className="font-medium">
              {canManage ? "Create your first project" : "No projects yet"}
            </p>
            <p className="text-muted-foreground max-w-sm text-sm">
              {canManage
                ? "A project connects one repository so your work stays organized and doesn't mix across repos."
                : "Ask an owner or admin of this organization to create a project."}
            </p>
            {canManage ? (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                New project
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {active.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="group focus-visible:ring-ring block rounded-xl focus-visible:ring-2 focus-visible:outline-none"
            >
              <Card className="hover:border-foreground/20 h-full transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-start gap-3">
                  <div className="bg-muted flex size-9 items-center justify-center rounded-lg">
                    <FolderKanban className="size-4" />
                  </div>
                  <div className="grid min-w-0 flex-1 gap-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{project.name}</span>
                      <Badge variant="outline" className="text-[11px]">
                        {project.key}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground flex items-center gap-1 truncate text-xs">
                      <FolderGit2 className="size-3" />
                      {repoByProject.get(project.id) ?? "no repo connected"}
                    </span>
                  </div>
                  <ChevronRight className="text-muted-foreground group-hover:text-foreground size-4 shrink-0 transition-colors" />
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {activeOrgId ? (
        <CreateProjectDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          organizationId={activeOrgId}
        />
      ) : null}
    </div>
  );
}
