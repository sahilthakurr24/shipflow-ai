"use client";

import * as React from "react";
import Link from "next/link";
import { Building2, Check, ChevronsUpDown, Plus, Settings } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";
import { Skeleton } from "~/components/ui/skeleton";
import { useOrganization } from "~/providers/organization";
import { CreateOrganizationDialog } from "./create-organization-dialog";

function orgInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "O";
}

export function OrganizationSwitcher() {
  const { isMobile } = useSidebar();
  const { organizations, activeOrg, activeOrgId, setActiveOrg, isLoading } = useOrganization();
  const [createOpen, setCreateOpen] = React.useState(false);

  if (isLoading && !activeOrg) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-2 p-2">
            <Skeleton className="size-8 rounded-lg" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="size-8 rounded-lg">
                  {activeOrg?.logoUrl ? (
                    <AvatarImage src={activeOrg.logoUrl} alt={activeOrg.name} />
                  ) : null}
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground rounded-lg">
                    {activeOrg ? orgInitial(activeOrg.name) : <Building2 className="size-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {activeOrg?.name ?? "Select organization"}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {organizations.length} organization{organizations.length === 1 ? "" : "s"}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="min-w-60 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Organizations
              </DropdownMenuLabel>
              {organizations.map((org) => (
                <DropdownMenuItem key={org.id} onClick={() => setActiveOrg(org.id)} className="gap-2">
                  <Avatar className="size-6 rounded-md">
                    {org.logoUrl ? <AvatarImage src={org.logoUrl} alt={org.name} /> : null}
                    <AvatarFallback className="rounded-md text-xs">
                      {orgInitial(org.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{org.name}</span>
                  {org.id === activeOrgId ? <Check className="ml-auto size-4" /> : null}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => setCreateOpen(true)} className="gap-2">
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <Plus className="size-4" />
                </div>
                <span className="text-muted-foreground font-medium">Create organization</span>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="gap-2">
                <Link href="/organizations">
                  <Settings className="size-4" />
                  <span>Manage organizations</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <CreateOrganizationDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
