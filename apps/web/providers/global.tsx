"use client";

import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import React, { useState } from "react";
import { Toaster } from "~/components/ui/sonner";
import { TooltipProvider } from "~/components/ui/tooltip";

import { trpc } from "~/trpc/client";
import { createTRPCHttpBatchClientClient } from "~/trpc/create-client";

const PERSIST_KEY = "shipflow.rq-cache";
const ONE_DAY = 1000 * 60 * 60 * 24;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: true,
      staleTime: Infinity,
      // Keep cached queries around long enough to be persisted/restored.
      gcTime: ONE_DAY,
    },
  },
});

// SSR-safe: `window` is undefined during server render, and the persister
// no-ops when given `undefined` storage.
const persister = createSyncStoragePersister({
  key: PERSIST_KEY,
  storage: typeof window !== "undefined" ? window.localStorage : undefined,
});

/** Wipe the in-memory + persisted query cache (call on logout). */
export function clearPersistedCache() {
  queryClient.clear();
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(PERSIST_KEY);
  }
}

export const GlobalProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [createTRPCHttpBatchClientClient()],
    }),
  );
  return (
    <PersistQueryClientProvider
      client={queryClient}
      // Bump `buster` to discard all persisted caches after a breaking change.
      persistOptions={{ persister, maxAge: ONE_DAY, buster: "v1" }}
    >
      <NextThemesProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <trpc.Provider queryClient={queryClient} client={trpcClient}>
          <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
          <Toaster />
        </trpc.Provider>
      </NextThemesProvider>
    </PersistQueryClientProvider>
  );
};
