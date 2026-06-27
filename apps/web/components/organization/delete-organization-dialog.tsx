"use client";

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
} from "~/components/ui/alert-dialog";
import { useDeleteOrganization } from "~/hooks/api/organization";
import type { Organization } from "~/providers/organization";

export function DeleteOrganizationDialog({
  org,
  open,
  onOpenChange,
}: {
  org: Organization;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { deleteOrganizationAsync, isPending } = useDeleteOrganization();

  async function handleDelete(event: React.MouseEvent) {
    event.preventDefault();
    try {
      await deleteOrganizationAsync({ id: org.id });
      toast.success(`Deleted ${org.name}`);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete organization");
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {org.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the organization and everything in it — repositories, PRDs,
            tasks, reviews, and members. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive hover:bg-destructive/90 text-white"
          >
            Delete organization
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
