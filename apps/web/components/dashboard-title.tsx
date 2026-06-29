"use client";

import { usePathname } from "next/navigation";

// First path segment under /dashboard → header label. Detail routes (a second
// segment, usually an id) use the singular form.
const SECTION_LABELS: Record<string, { list: string; detail: string }> = {
  tasks: { list: "Tasks", detail: "Task" },
  prds: { list: "PRDs", detail: "PRD" },
  "feature-requests": { list: "Feature Requests", detail: "Feature Request" },
  repositories: { list: "Repositories", detail: "Repository" },
};

export function DashboardTitle() {
  const pathname = usePathname() ?? "";
  const segments = pathname.split("/").filter(Boolean); // e.g. ["dashboard", "tasks", ":id"]
  const section = segments[1];
  const isDetail = segments.length > 2;

  const entry = section ? SECTION_LABELS[section] : undefined;
  const label = entry ? (isDetail ? entry.detail : entry.list) : "Dashboard";

  return <h1 className="text-sm font-medium">{label}</h1>;
}
