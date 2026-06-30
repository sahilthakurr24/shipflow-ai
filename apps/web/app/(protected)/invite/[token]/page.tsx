"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Check, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { useAcceptInvitation, useGetInvitationByToken } from "~/hooks/api/invitation";
import { authClient } from "~/lib/auth-client";
import { useOrganization } from "~/providers/organization";

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">{children}</Card>
    </div>
  );
}

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();
  const { setActiveOrg } = useOrganization();
  const { data: session } = authClient.useSession();

  const { invitation, organization, invitedByName, isLoading } = useGetInvitationByToken({ token });
  const { acceptInvitationAsync, isPending } = useAcceptInvitation();

  async function accept() {
    try {
      const { organizationId } = await acceptInvitationAsync({ token });
      setActiveOrg(organizationId);
      toast.success("You've joined the organization");
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to accept invitation");
    }
  }

  if (isLoading) {
    return (
      <Shell>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Shell>
    );
  }

  // Invalid / no-longer-valid states.
  const expired =
    invitation && (invitation.status === "expired" || new Date(invitation.expiresAt) < new Date());
  const invalidReason = !invitation
    ? "This invitation link is invalid."
    : invitation.status === "revoked"
      ? "This invitation has been revoked."
      : invitation.status === "accepted"
        ? "This invitation has already been accepted."
        : expired
          ? "This invitation has expired."
          : null;

  if (invalidReason) {
    return (
      <Shell>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TriangleAlert className="text-amber-500 size-5" />
            Invitation unavailable
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">{invalidReason}</p>
          <Button asChild variant="outline">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </CardContent>
      </Shell>
    );
  }

  // Email-bound: warn if the signed-in user isn't the invitee (server will reject).
  const sessionEmail = session?.user?.email?.toLowerCase();
  const emailMismatch = sessionEmail ? sessionEmail !== invitation!.email.toLowerCase() : false;
  const orgName = organization?.name ?? "an organization";

  return (
    <Shell>
      <CardHeader>
        <CardTitle className="text-lg">You&apos;re invited</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed">
          {invitedByName ? `${invitedByName} invited you` : "You've been invited"} to join{" "}
          <span className="font-semibold">{orgName}</span> as{" "}
          <span className="font-semibold">{ROLE_LABEL[invitation!.role] ?? invitation!.role}</span>.
        </p>

        <div className="text-muted-foreground rounded-lg border p-3 text-xs">
          Invitation sent to <span className="text-foreground font-medium">{invitation!.email}</span>
        </div>

        {emailMismatch ? (
          <p className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            You&apos;re signed in as {session?.user?.email}, but this invite was sent to{" "}
            {invitation!.email}. Sign in with that address to accept.
          </p>
        ) : null}

        <div className="flex gap-2">
          <Button onClick={accept} disabled={isPending || emailMismatch} className="flex-1">
            {isPending ? <Loader2 className="animate-spin" /> : <Check className="size-4" />}
            Accept invitation
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Decline</Link>
          </Button>
        </div>
      </CardContent>
    </Shell>
  );
}
