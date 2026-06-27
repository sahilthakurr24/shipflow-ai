import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function OrganizationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 md:py-12">
      <Link
        href="/dashboard"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>
      {children}
    </div>
  );
}
