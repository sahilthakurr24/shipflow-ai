"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Lock,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import {
  useGetRepoBranches,
  useGetRepoCommits,
  useGetRepoOpenPullRequests,
  useGetRepositoryById,
} from "~/hooks/api/repository";

function shortSha(sha: string) {
  return sha.slice(0, 7);
}

function timeAgo(date?: string) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 rounded-lg" />
      ))}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground py-2 text-sm">{children}</p>;
}

function SectionError() {
  return <p className="text-destructive py-2 text-sm">Couldn&apos;t load from GitHub.</p>;
}

export default function RepositoryDetailPage() {
  const params = useParams<{ repoId: string }>();
  const repoId = params.repoId;

  const { repository, isLoading: repoLoading } = useGetRepositoryById({ id: repoId });
  const commits = useGetRepoCommits({ repositoryId: repoId });
  const branches = useGetRepoBranches({ repositoryId: repoId });
  const prs = useGetRepoOpenPullRequests({ repositoryId: repoId });

  const lastCommit = commits.commits[0];

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard/repositories"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Repositories
      </Link>

      {/* Header */}
      {repoLoading ? (
        <Skeleton className="h-20 rounded-xl" />
      ) : repository ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-muted flex size-10 items-center justify-center rounded-lg">
              <GitBranch className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold tracking-tight">{repository.fullName}</h2>
                {repository.isPrivate ? (
                  <Badge variant="secondary" className="gap-1">
                    <Lock className="size-3" />
                    Private
                  </Badge>
                ) : (
                  <Badge variant="outline">Public</Badge>
                )}
                <Badge variant="secondary" className="gap-1">
                  <Check className="size-3" />
                  Connected
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                default branch: {repository.defaultBranch}
              </p>
            </div>
          </div>
          {repository.htmlUrl ? (
            <Button asChild variant="outline" size="sm">
              <a href={repository.htmlUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                Open on GitHub
              </a>
            </Button>
          ) : null}
        </div>
      ) : (
        <Empty>Repository not found.</Empty>
      )}

      {/* Last commit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GitCommit className="size-4" />
            Last commit
          </CardTitle>
        </CardHeader>
        <CardContent>
          {commits.isLoading ? (
            <Skeleton className="h-10 rounded-lg" />
          ) : commits.error ? (
            <SectionError />
          ) : lastCommit ? (
            <div className="flex items-center gap-3">
              <Avatar className="size-7">
                {lastCommit.authorAvatar ? (
                  <AvatarImage src={lastCommit.authorAvatar} alt={lastCommit.authorName} />
                ) : null}
                <AvatarFallback className="text-xs">
                  {lastCommit.authorName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{lastCommit.message.split("\n")[0]}</p>
                <p className="text-muted-foreground text-xs">
                  {lastCommit.authorName} · {timeAgo(lastCommit.date)}
                </p>
              </div>
              <a
                href={lastCommit.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground font-mono text-xs"
              >
                {shortSha(lastCommit.sha)}
              </a>
            </div>
          ) : (
            <Empty>No commits yet.</Empty>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Open PRs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GitPullRequest className="size-4" />
              Open pull requests
              {prs.pullRequests.length > 0 ? (
                <Badge variant="secondary">{prs.pullRequests.length}</Badge>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {prs.isLoading ? (
              <SectionSkeleton />
            ) : prs.error ? (
              <SectionError />
            ) : prs.pullRequests.length === 0 ? (
              <Empty>No open pull requests.</Empty>
            ) : (
              <div className="flex flex-col gap-2">
                {prs.pullRequests.map((pr) => (
                  <a
                    key={pr.number}
                    href={pr.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:bg-accent/50 -mx-2 flex flex-col gap-1 rounded-lg px-2 py-2 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{pr.title}</span>
                      {pr.isDraft ? (
                        <Badge variant="outline" className="text-xs">
                          Draft
                        </Badge>
                      ) : null}
                    </div>
                    <span className="text-muted-foreground text-xs">
                      #{pr.number} · {pr.authorLogin ?? "unknown"} · {pr.headBranch} → {pr.baseBranch}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Branches */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GitBranch className="size-4" />
              Branches
              {branches.branches.length > 0 ? (
                <Badge variant="secondary">{branches.branches.length}</Badge>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {branches.isLoading ? (
              <SectionSkeleton />
            ) : branches.error ? (
              <SectionError />
            ) : branches.branches.length === 0 ? (
              <Empty>No branches.</Empty>
            ) : (
              <div className="flex flex-col gap-1">
                {branches.branches.map((branch) => (
                  <div
                    key={branch.name}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm"
                  >
                    <GitBranch className="text-muted-foreground size-3.5 shrink-0" />
                    <span className="truncate">{branch.name}</span>
                    {repository && branch.name === repository.defaultBranch ? (
                      <Badge variant="outline" className="text-xs">
                        default
                      </Badge>
                    ) : null}
                    {branch.isProtected ? (
                      <Badge variant="secondary" className="text-xs">
                        protected
                      </Badge>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent commits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GitCommit className="size-4" />
            Recent commits
          </CardTitle>
        </CardHeader>
        <CardContent>
          {commits.isLoading ? (
            <SectionSkeleton rows={5} />
          ) : commits.error ? (
            <SectionError />
          ) : commits.commits.length === 0 ? (
            <Empty>No commits yet.</Empty>
          ) : (
            <div className="flex flex-col">
              {commits.commits.map((commit) => (
                <a
                  key={commit.sha}
                  href={commit.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:bg-accent/50 -mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors"
                >
                  <Avatar className="size-6">
                    {commit.authorAvatar ? (
                      <AvatarImage src={commit.authorAvatar} alt={commit.authorName} />
                    ) : null}
                    <AvatarFallback className="text-[10px]">
                      {commit.authorName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {commit.message.split("\n")[0]}
                  </span>
                  <span className="text-muted-foreground hidden text-xs sm:inline">
                    {timeAgo(commit.date)}
                  </span>
                  <span className="text-muted-foreground font-mono text-xs">
                    {shortSha(commit.sha)}
                  </span>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
