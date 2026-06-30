"use client";

import * as React from "react";
import { skipToken } from "@tanstack/react-query";
import { Mail, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { InviteMemberDialog, INVITE_ROLES } from "~/components/members/invite-member-dialog";
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
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { useRemoveMember, useUpdateMemberRole } from "~/hooks/api/membership";
import { useRevokeInvitation } from "~/hooks/api/invitation";
import { authClient } from "~/lib/auth-client";
import { useOrganization } from "~/providers/organization";
import { trpc } from "~/trpc/client";

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function MembersPage() {
  const { activeOrgId } = useOrganization();
  const { data: session } = authClient.useSession();
  const viewerId = session?.user?.id;

  // Poll so an invitee accepting in another browser/session is reflected here
  // within a few seconds (global queries are staleTime: Infinity → no real-time).
  const membersQuery = trpc.membership.listOrganizationMembers.useQuery(
    activeOrgId ? { organizationId: activeOrgId } : skipToken,
    { refetchInterval: 5000 },
  );
  const members = membersQuery.data?.members ?? [];
  const isLoading = membersQuery.isLoading;

  const invitationsQuery = trpc.invitation.listInvitations.useQuery(
    activeOrgId ? { organizationId: activeOrgId, status: "pending" } : skipToken,
    { refetchInterval: 5000 },
  );
  const invitations = invitationsQuery.data?.invitations ?? [];
  const { updateMemberRoleAsync } = useUpdateMemberRole();
  const { removeMemberAsync } = useRemoveMember();
  const { revokeInvitationAsync } = useRevokeInvitation();

  const [inviteOpen, setInviteOpen] = React.useState(false);

  const viewerRole = members.find((m) => m.userId === viewerId)?.role;
  const canManage = viewerRole === "owner" || viewerRole === "admin";

  async function changeRole(userId: string, role: string) {
    if (!activeOrgId) return;
    try {
      await updateMemberRoleAsync({
        organizationId: activeOrgId,
        userId,
        role: role as "admin" | "member" | "viewer",
      });
      toast.success("Role updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update role");
    }
  }

  async function removeMember(userId: string) {
    if (!activeOrgId) return;
    try {
      await removeMemberAsync({ organizationId: activeOrgId, userId });
      toast.success("Member removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove member");
    }
  }

  async function revoke(id: string) {
    try {
      await revokeInvitationAsync({ id });
      toast.success("Invitation revoked");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Members</h2>
          <p className="text-muted-foreground text-sm">
            People in this organization and their roles.
          </p>
        </div>
        {canManage ? (
          <Button onClick={() => setInviteOpen(true)} disabled={!activeOrgId}>
            <UserPlus className="size-4" />
            Invite member
          </Button>
        ) : null}
      </header>

      {!activeOrgId ? (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center text-sm">
            Select an organization first.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Members ({members.length})</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {isLoading ? (
                [0, 1, 2].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)
              ) : (
                members.map((m) => {
                  const isSelf = m.userId === viewerId;
                  const isOwner = m.role === "owner";
                  const editable = canManage && !isSelf && !isOwner;
                  return (
                    <div key={m.userId} className="flex items-center gap-3 rounded-lg py-2">
                      <Avatar className="size-8">
                        <AvatarImage src={m.profileImageUrl ?? undefined} alt={m.fullName} />
                        <AvatarFallback className="text-xs">{initials(m.fullName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{m.fullName}</span>
                          {isSelf ? (
                            <Badge variant="secondary" className="text-[11px]">
                              You
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-muted-foreground truncate text-xs">{m.email}</p>
                      </div>
                      {editable ? (
                        <Select value={m.role} onValueChange={(v) => changeRole(m.userId, v)}>
                          <SelectTrigger className="h-8 w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {INVITE_ROLES.map((r) => (
                              <SelectItem key={r.value} value={r.value}>
                                {r.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className="capitalize">
                          {ROLE_LABEL[m.role] ?? m.role}
                        </Badge>
                      )}
                      {editable ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive size-8"
                              aria-label="Remove member"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove {m.fullName}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                They&apos;ll lose access to this organization. This can&apos;t be
                                undone (you&apos;d need to re-invite them).
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={(e) => {
                                  e.preventDefault();
                                  void removeMember(m.userId);
                                }}
                                className="bg-destructive hover:bg-destructive/90 text-white"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : null}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Pending invitations */}
          {canManage ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Pending invitations ({invitations.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                {invitations.length === 0 ? (
                  <p className="text-muted-foreground/70 flex flex-col items-center gap-2 py-6 text-center text-sm">
                    <Mail className="size-5" />
                    No pending invitations.
                    <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}>
                      <Plus className="size-4" />
                      Invite someone
                    </Button>
                  </p>
                ) : (
                  invitations.map((inv) => (
                    <div key={inv.id} className="flex items-center gap-3 rounded-lg py-2">
                      <div className="bg-muted flex size-8 items-center justify-center rounded-full">
                        <Mail className="text-muted-foreground size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{inv.email}</p>
                        <p className="text-muted-foreground text-xs">
                          Expires {new Date(inv.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {ROLE_LABEL[inv.role] ?? inv.role}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => revoke(inv.id)}
                      >
                        Revoke
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ) : null}

          <InviteMemberDialog
            open={inviteOpen}
            onOpenChange={setInviteOpen}
            organizationId={activeOrgId}
          />
        </>
      )}
    </div>
  );
}
