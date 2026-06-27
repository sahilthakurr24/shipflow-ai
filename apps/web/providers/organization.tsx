"use client";

import * as React from "react";

import { useGetUserOrganizations } from "~/hooks/api/organization";
import { trpc } from "~/trpc/client";

const ACTIVE_ORG_COOKIE = "shipflow.activeOrg";

export type Organization = ReturnType<typeof useGetUserOrganizations>["organizations"][number];

type OrganizationContextValue = {
  organizations: Organization[];
  activeOrg: Organization | undefined;
  activeOrgId: string | undefined;
  setActiveOrg: (id: string) => void;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
};

const OrganizationContext = React.createContext<OrganizationContextValue | null>(null);

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

function writeCookie(name: string, value: string) {
  // 1 year, root path so server components can read it via cookies().
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
}

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const utils = trpc.useUtils();
  const { organizations, isLoading, error, refetch } = useGetUserOrganizations();
  const isError = Boolean(error);
  const [activeOrgId, setActiveOrgId] = React.useState<string | undefined>(undefined);

  // Resolve the active org whenever the list changes: keep current if still valid,
  // else cookie, else the first org, else undefined (zero-org state).
  React.useEffect(() => {
    if (organizations.length === 0) {
      setActiveOrgId(undefined);
      return;
    }
    setActiveOrgId((current) => {
      if (current && organizations.some((org) => org.id === current)) return current;
      const cookieId = readCookie(ACTIVE_ORG_COOKIE);
      if (cookieId && organizations.some((org) => org.id === cookieId)) return cookieId;
      return organizations[0]?.id;
    });
  }, [organizations]);

  const setActiveOrg = React.useCallback(
    (id: string) => {
      setActiveOrgId(id);
      writeCookie(ACTIVE_ORG_COOKIE, id);
      // Re-fetch every org-scoped query against the newly active org.
      void utils.invalidate();
    },
    [utils],
  );

  const activeOrg = React.useMemo(
    () => organizations.find((org) => org.id === activeOrgId),
    [organizations, activeOrgId],
  );

  const value = React.useMemo<OrganizationContextValue>(
    () => ({ organizations, activeOrg, activeOrgId, setActiveOrg, isLoading, isError, refetch }),
    [organizations, activeOrg, activeOrgId, setActiveOrg, isLoading, isError, refetch],
  );

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganization() {
  const ctx = React.useContext(OrganizationContext);
  if (!ctx) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return ctx;
}
