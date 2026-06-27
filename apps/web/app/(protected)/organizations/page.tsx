"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { CreateOrganizationDialog } from "~/components/organization/create-organization-dialog";
import { OrganizationCard } from "~/components/organization/organization-card";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { useOrganization } from "~/providers/organization";

export default function OrganizationsPage() {
  const { organizations, isLoading, isError } = useOrganization();
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground text-sm">
            Manage the organizations you belong to.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          New organization
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="text-destructive py-10 text-center text-sm">
            Couldn&apos;t load your organizations. Please try again.
          </CardContent>
        </Card>
      ) : organizations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-muted-foreground text-sm">
              You don&apos;t belong to any organizations yet.
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus />
              Create your first organization
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {organizations.map((org) => (
            <OrganizationCard key={org.id} org={org} />
          ))}
        </div>
      )}

      <CreateOrganizationDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
