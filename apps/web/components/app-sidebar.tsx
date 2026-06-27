"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CircleCheck,
  CreditCard,
  FileText,
  FolderGit2,
  GitPullRequest,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Rocket,
  ScanSearch,
  Settings,
  Users,
} from "lucide-react";

import { NavUser } from "~/components/nav-user";
import { OrganizationSwitcher } from "~/components/organization/organization-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "~/components/ui/sidebar";

export type AppSidebarUser = { name: string; email: string; avatar: string };

type NavItem = { title: string; url: string; icon: React.ElementType };

// Mirrors the ShipFlow delivery flow: feature request → PRD → tasks → code → review → ship.
const platform: NavItem[] = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Feature Requests", url: "/dashboard/feature-requests", icon: Lightbulb },
  { title: "PRDs", url: "/dashboard/prds", icon: FileText },
  { title: "Tasks", url: "/dashboard/tasks", icon: ListChecks },
  { title: "Repositories", url: "/dashboard/repositories", icon: FolderGit2 },
  { title: "Pull Requests", url: "/dashboard/pull-requests", icon: GitPullRequest },
  { title: "Reviews", url: "/dashboard/reviews", icon: ScanSearch },
  { title: "Approvals", url: "/dashboard/approvals", icon: CircleCheck },
  { title: "Releases", url: "/dashboard/releases", icon: Rocket },
];

const workspace: NavItem[] = [
  { title: "Members", url: "/dashboard/members", icon: Users },
  { title: "Billing", url: "/dashboard/billing", icon: CreditCard },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive =
            item.url === "/dashboard" ? pathname === item.url : pathname.startsWith(item.url);
          return (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

export function AppSidebar({
  user,
  ...props
}: { user: AppSidebarUser } & React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrganizationSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Platform" items={platform} pathname={pathname} />
        <NavGroup label="Workspace" items={workspace} pathname={pathname} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
