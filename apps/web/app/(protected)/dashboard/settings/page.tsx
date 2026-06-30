"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CreditCard, Loader2, Trash2, Users } from "lucide-react";
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
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import { useDeleteOrganization, useUpdateOrganization } from "~/hooks/api/organization";
import { useOrganization } from "~/providers/organization";

export default function SettingsPage() {
  const router = useRouter();
  const { activeOrg, activeOrgId, refetch } = useOrganization();
  const { updateOrganizationAsync, isPending: isSaving } = useUpdateOrganization();
  const { deleteOrganizationAsync, isPending: isDeleting } = useDeleteOrganization();

  const canManage = activeOrg?.role === "owner" || activeOrg?.role === "admin";
  const isOwner = activeOrg?.role === "owner";

  const [name, setName] = React.useState("");
  const seeded = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    if (activeOrg && seeded.current !== activeOrg.id) {
      seeded.current = activeOrg.id;
      setName(activeOrg.name);
    }
  }, [activeOrg]);

  async function save() {
    if (!activeOrgId || !name.trim()) {
      toast.error("Name can't be empty");
      return;
    }
    try {
      await updateOrganizationAsync({ id: activeOrgId, name: name.trim() });
      toast.success("Organization updated");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update organization");
    }
  }

  async function deleteOrg() {
    if (!activeOrgId) return;
    try {
      await deleteOrganizationAsync({ id: activeOrgId });
      // Drop the active-org cookie so the provider re-selects after the redirect.
      document.cookie = "shipflow.activeOrg=; path=/; max-age=0";
      toast.success("Organization deleted");
      refetch();
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete organization");
    }
  }

  if (!activeOrg) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-muted-foreground text-sm">Manage your organization and workspace.</p>
      </header>

      {/* Organization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="org-name">Name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canManage}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="org-slug">Slug</Label>
            <Input id="org-slug" value={activeOrg.slug} disabled />
            <p className="text-muted-foreground/70 text-xs">
              The slug is generated from the name and can&apos;t be edited.
            </p>
          </div>
          {canManage ? (
            <Button onClick={save} disabled={isSaving} className="self-start">
              {isSaving ? <Loader2 className="animate-spin" /> : <Check className="size-4" />}
              Save changes
            </Button>
          ) : (
            <p className="text-muted-foreground/70 text-sm italic">
              Only owners and admins can edit organization settings.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workspace</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button asChild variant="outline" className="justify-start">
            <Link href="/dashboard/members">
              <Users className="size-4" />
              Members
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link href="/dashboard/billing">
              <CreditCard className="size-4" />
              Billing
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Danger zone (owner only) */}
      {isOwner ? (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive text-base">Danger zone</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Delete this organization</p>
              <p className="text-muted-foreground text-sm">
                Permanently removes the organization and all of its data. This can&apos;t be undone.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  {isDeleting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {activeOrg.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes the organization and everything in it — projects,
                    feature requests, PRs, reviews and releases. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteOrg}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    Delete organization
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
