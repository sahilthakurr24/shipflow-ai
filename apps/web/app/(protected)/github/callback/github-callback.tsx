"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { useCompleteGithubInstallation } from "~/hooks/api/repository";

const REPOS = "/dashboard/repositories";

export function GithubCallback({
  installationId,
  state,
}: {
  installationId?: string;
  state?: string;
}) {
  const router = useRouter();
  const { completeGithubInstallationAsync } = useCompleteGithubInstallation();
  const [error, setError] = React.useState<string | null>(null);
  const ranRef = React.useRef(false);

  React.useEffect(() => {
    // Strict Mode runs effects twice in dev; guard so the mutation fires once.
    if (ranRef.current) return;
    ranRef.current = true;

    if (!installationId || !state) {
      setError("Missing installation details from GitHub.");
      return;
    }

    completeGithubInstallationAsync({ installationId, organizationId: state })
      .then(({ count }) => {
        toast.success(`Connected ${count} ${count === 1 ? "repository" : "repositories"}`);
        router.replace(REPOS);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to complete installation.");
      });
  }, [installationId, state, completeGithubInstallationAsync, router]);

  if (error) {
    return (
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <AlertCircle className="text-destructive size-8" />
        <div className="space-y-1">
          <p className="font-medium">Couldn&apos;t finish connecting</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
        <Button onClick={() => router.replace(REPOS)}>Back to repositories</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Loader2 className="text-muted-foreground size-8 animate-spin" />
      <p className="font-medium">Connecting your repositories…</p>
      <p className="text-muted-foreground text-sm">This only takes a moment.</p>
    </div>
  );
}
