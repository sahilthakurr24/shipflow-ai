import React from "react";
import { requiredAuth } from "~/auth/actions";

export async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requiredAuth();
  return <div className="min-h-svh">{children}</div>;
}
