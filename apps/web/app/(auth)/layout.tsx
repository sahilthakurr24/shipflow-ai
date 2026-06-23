import React from "react";
import { requiredUnAuth } from "../../auth/actions/index";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  await requiredUnAuth();

  return (
    <div className="flex min-h-svh flex-1 flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
