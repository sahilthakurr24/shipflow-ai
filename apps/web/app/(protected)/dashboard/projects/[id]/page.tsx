"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { skipToken } from "@tanstack/react-query";
import {
  ArrowLeft,
  FileText,
  FolderGit2,
  GitPullRequest,
  Lightbulb,
  ListChecks,
  Loader2,
  ScanSearch,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { useDeleteProject, useGetProjectById } from "~/hooks/api/project";
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
  const router = useRouter();
  const { activeOrgId, activeOrg } = useOrganization();
  const canManage = activeOrg?.role === "owner" || activeOrg?.role === "admin";

  const { project, isLoading } = useGetProjectById({ id });
  const { repositories } = useListRepositories(
    activeOrgId ? { organizationId: activeOrgId } : skipToken,
  );
  const repo = repositories.find((r) => r.projectId === id);

  const { deleteProjectAsync, isPending: isDeleting } = useDeleteProject();

  async function deleteProject() {
    try {
      await deleteProjectAsync({ id });
      toast.success("Project deleted");
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete project");
    }
  }

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

      {canManage ? (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive text-base">Danger zone</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Delete this project</p>
              <p className="text-muted-foreground text-sm">
                Permanently removes the project and all of its feature requests, PRDs, tasks,
                pull requests, and reviews. This can&apos;t be undone.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 className="size-4" />}
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {project.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes the project and everything in it — feature requests,
                    PRDs, tasks, pull requests, and reviews. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteProject}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    Delete project
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
