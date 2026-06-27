import React from "react";

import { requiredUnAuth } from "../../auth/actions/index";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  await requiredUnAuth();

  return (
    <div className="relative flex min-h-svh flex-1 flex-col items-center justify-center px-4 py-12">
      {/* Subtle ambient gradient — Linear/Vercel-style, very low contrast. */}
      <div
        aria-hidden
        className="from-muted/50 pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b to-transparent"
      />
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
