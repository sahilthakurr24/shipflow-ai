"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  FileText,
  FolderGit2,
  GitPullRequest,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
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

type NavItem = { title: string; url: string; icon: React.ElementType; exact?: boolean };

// Org-level nav (shown when you're not inside a project). Repositories is here
// because connecting the GitHub App + repos is org-level — projects then claim one.
const orgNav: NavItem[] = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard, exact: true },
  { title: "Repositories", url: "/dashboard/repositories", icon: FolderGit2 },
];

const workspace: NavItem[] = [
  { title: "Members", url: "/dashboard/members", icon: Users },
  { title: "Billing", url: "/dashboard/billing", icon: CreditCard },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

// Project-level nav (shown inside /dashboard/projects/[id]).
function projectNav(projectId: string): NavItem[] {
  const base = `/dashboard/projects/${projectId}`;
  return [
    { title: "Overview", url: base, icon: LayoutDashboard, exact: true },
    { title: "Feature Requests", url: `${base}/feature-requests`, icon: Lightbulb },
    { title: "PRDs", url: `${base}/prds`, icon: FileText },
    { title: "Tasks", url: `${base}/tasks`, icon: ListChecks },
    { title: "Pull Requests", url: `${base}/pull-requests`, icon: GitPullRequest },
    { title: "Reviews", url: `${base}/reviews`, icon: ScanSearch },
    { title: "Repository", url: `${base}/repository`, icon: FolderGit2 },
  ];
}

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
          const isActive = item.exact ? pathname === item.url : pathname.startsWith(item.url);
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

  // Inside /dashboard/projects/<id> we show that project's sections instead of
  // the org-level nav.
  const parts = pathname.split("/").filter(Boolean); // ["dashboard","projects","<id>",...]
  const projectId = parts[0] === "dashboard" && parts[1] === "projects" ? parts[2] : undefined;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrganizationSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {projectId ? (
          // Inside a project: only the project's own nav (+ a way back to projects).
          <>
            <NavGroup
              label="All projects"
              items={[{ title: "Projects", url: "/dashboard", icon: ArrowLeft, exact: true }]}
              pathname={pathname}
            />
            <NavGroup label="Project" items={projectNav(projectId)} pathname={pathname} />
          </>
        ) : (
          // Org level: overview/repos + the org-admin workspace.
          <>
            <NavGroup label="Organization" items={orgNav} pathname={pathname} />
            <NavGroup label="Workspace" items={workspace} pathname={pathname} />
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
