"use client";

import { UserPlus, X } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import {
  useListOrganizationMembers,
  useRemoveMember,
  useUpdateMemberRole,
} from "~/hooks/api/membership";
import type { Organization } from "~/providers/organization";

const ROLES = ["owner", "admin", "member", "viewer"] as const;

function initials(name: string, email: string) {
  const source = name.trim() || email;
  return (
    source
      .split(/\s+/)
      .map((part) => part[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"
  );
}

function MembersBody({ org }: { org: Organization }) {
  const { members, isLoading, error } = useListOrganizationMembers({ organizationId: org.id });
  const isError = Boolean(error);
  const { updateMemberRoleAsync } = useUpdateMemberRole();
  const { removeMemberAsync } = useRemoveMember();

  const canManage = org.role === "owner" || org.role === "admin";

  async function handleRole(userId: string, role: (typeof ROLES)[number]) {
    try {
      await updateMemberRoleAsync({ organizationId: org.id, userId, role });
      toast.success("Role updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update role");
    }
  }

  async function handleRemove(userId: string) {
    try {
      await removeMemberAsync({ organizationId: org.id, userId });
      toast.success("Member removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove member");
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 py-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-44" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-destructive py-4 text-sm">Couldn&apos;t load members.</p>;
  }

  if (members.length === 0) {
    return <p className="text-muted-foreground py-4 text-sm">No members yet.</p>;
  }

  return (
    <div className="flex flex-col gap-1 py-2">
      {members.map((member) => (
        <div
          key={member.userId}
          className="hover:bg-accent/50 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors"
        >
          <Avatar className="size-9">
            {member.profileImageUrl ? (
              <AvatarImage src={member.profileImageUrl} alt={member.fullName} />
            ) : null}
            <AvatarFallback className="text-xs">
              {initials(member.fullName, member.email)}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 leading-tight">
            <span className="truncate text-sm font-medium">{member.fullName}</span>
            <span className="text-muted-foreground truncate text-xs">{member.email}</span>
          </div>

          {canManage ? (
            <Select
              defaultValue={member.role}
              onValueChange={(value) => handleRole(member.userId, value as (typeof ROLES)[number])}
            >
              <SelectTrigger size="sm" className="w-28 capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role} className="capitalize">
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-muted-foreground text-xs capitalize">{member.role}</span>
          )}

          {canManage ? (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive size-8"
              onClick={() => handleRemove(member.userId)}
              aria-label={`Remove ${member.fullName}`}
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function OrganizationMembersDialog({
  org,
  open,
  onOpenChange,
}: {
  org: Organization;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Members</DialogTitle>
          <DialogDescription>{org.name}</DialogDescription>
        </DialogHeader>

        <MembersBody org={org} />

        <DialogFooter>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <Button variant="outline" disabled className="pointer-events-none">
                  <UserPlus />
                  Invite member
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Email invitations are coming soon.</TooltipContent>
          </Tooltip>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
