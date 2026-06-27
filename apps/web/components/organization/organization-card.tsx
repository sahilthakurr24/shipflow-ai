"use client";

import * as React from "react";
import { Check, LogOut, MoreHorizontal, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useLeaveOrganization } from "~/hooks/api/membership";
import { useOrganization, type Organization } from "~/providers/organization";
import { DeleteOrganizationDialog } from "./delete-organization-dialog";
import { OrganizationMembersDialog } from "./organization-members-dialog";
import { RenameOrganizationDialog } from "./rename-organization-dialog";

function orgInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "O";
}

export function OrganizationCard({ org }: { org: Organization }) {
  const { activeOrgId, setActiveOrg } = useOrganization();
  const { leaveOrganizationAsync } = useLeaveOrganization();

  const [renameOpen, setRenameOpen] = React.useState(false);
  const [membersOpen, setMembersOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [leaveOpen, setLeaveOpen] = React.useState(false);

  const isActive = org.id === activeOrgId;
  const isOwner = org.role === "owner";
  const canManage = isOwner || org.role === "admin";

  async function handleLeave(event: React.MouseEvent) {
    event.preventDefault();
    try {
      await leaveOrganizationAsync({ organizationId: org.id });
      toast.success(`Left ${org.name}`);
      setLeaveOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to leave organization");
    }
  }

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start gap-3">
        <Avatar className="size-10 rounded-lg">
          {org.logoUrl ? <AvatarImage src={org.logoUrl} alt={org.name} /> : null}
          <AvatarFallback className="bg-muted rounded-lg text-sm font-medium">
            {orgInitial(org.name)}
          </AvatarFallback>
        </Avatar>

        <div className="grid flex-1 gap-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold">{org.name}</span>
            {isActive ? (
              <Badge variant="secondary" className="gap-1">
                <Check className="size-3" />
                Active
              </Badge>
            ) : null}
          </div>
          <span className="text-muted-foreground truncate text-xs">{org.slug}</span>
        </div>

        <Badge variant="outline" className="capitalize">
          {org.role}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" aria-label="Organization actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            {!isActive ? (
              <DropdownMenuItem onClick={() => setActiveOrg(org.id)}>
                <Check />
                Set active
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={() => setMembersOpen(true)}>
              <Users />
              Members
            </DropdownMenuItem>
            {canManage ? (
              <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                <Pencil />
                Rename
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setLeaveOpen(true)}>
              <LogOut />
              Leave
            </DropdownMenuItem>
            {isOwner ? (
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 />
                Delete
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      {!isActive ? (
        <CardContent>
          <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveOrg(org.id)}>
            Switch to this organization
          </Button>
        </CardContent>
      ) : null}

      <RenameOrganizationDialog org={org} open={renameOpen} onOpenChange={setRenameOpen} />
      <OrganizationMembersDialog org={org} open={membersOpen} onOpenChange={setMembersOpen} />
      <DeleteOrganizationDialog org={org} open={deleteOpen} onOpenChange={setDeleteOpen} />

      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave {org.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ll lose access to this organization&apos;s data. The sole owner can&apos;t
              leave — transfer ownership or delete the organization instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeave}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
