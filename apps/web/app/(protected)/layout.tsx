import React from "react";

import { requiredAuth } from "../../auth/actions/index";
import { OrganizationProvider } from "~/providers/organization";

// Guards every protected route (/dashboard, /organizations) and provides the
// active-organization context to the sidebar and pages beneath it.
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requiredAuth();

  return <OrganizationProvider>{children}</OrganizationProvider>;
}
