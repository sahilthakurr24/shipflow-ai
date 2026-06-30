"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { skipToken } from "@tanstack/react-query";
import {
  ArrowLeft,
  FileText,
  FolderGit2,
  GitPullRequest,
  Lightbulb,
  ListChecks,
  ScanSearch,
} from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { useGetProjectById } from "~/hooks/api/project";
import { useListRepositories } from "~/hooks/api/repository";
import { useOrganization } from "~/providers/organization";

const SECTIONS = [
  { key: "feature-requests", label: "Feature Requests", icon: Lightbulb },
  { key: "prds", label: "PRDs", icon: FileText },
  { key: "tasks", label: "Tasks", icon: ListChecks },
  { key: "pull-requests", label: "Pull Requests", icon: GitPullRequest },
  { key: "reviews", label: "Reviews", icon: ScanSearch },
] as const;

export default function ProjectWorkspacePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { activeOrgId } = useOrganization();

  const { project, isLoading } = useGetProjectById({ id });
  const { repositories } = useListRepositories(
    activeOrgId ? { organizationId: activeOrgId } : skipToken,
  );
  const repo = repositories.find((r) => r.projectId === id);

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <p className="text-muted-foreground text-sm">Project not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Link
        href="/dashboard"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Projects
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">{project.name}</h2>
        <Badge variant="outline">{project.key}</Badge>
      </div>
      {project.description ? (
        <p className="text-muted-foreground -mt-3 text-sm">{project.description}</p>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="bg-muted flex size-9 items-center justify-center rounded-lg">
            <FolderGit2 className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm">Connected repository</CardTitle>
            <p className="text-muted-foreground truncate text-xs">
              {repo ? repo.fullName : "No repository connected"}
            </p>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.key}
              href={`/dashboard/projects/${id}/${section.key}`}
              className="group focus-visible:ring-ring block rounded-xl focus-visible:ring-2 focus-visible:outline-none"
            >
              <Card className="hover:border-foreground/20 transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-center gap-3">
                  <Icon className="text-muted-foreground size-5" />
                  <CardTitle className="text-base">{section.label}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
