import React from "react";

import { requiredAuth } from "../../../auth/actions/index";
import { AppSidebar } from "~/components/app-sidebar";
import { Separator } from "~/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requiredAuth();

  const user = {
    name: session.user.name ?? session.user.email,
    email: session.user.email,
    avatar: session.user.image ?? "",
  };

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="bg-background/80 sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <h1 className="text-sm font-medium">Dashboard</h1>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
