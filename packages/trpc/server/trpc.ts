import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";

import { createContext } from "./context";

export const tRPCContext = initTRPC.meta<OpenApiMeta>().context<typeof createContext>().create({});

export const router = tRPCContext.router;

export const publicProcedure = tRPCContext.procedure;

/**
 * A procedure that requires an authenticated BetterAuth session. It rejects
 * unauthenticated requests with UNAUTHORIZED and, for authorized ones, narrows
 * the context so `ctx.user`/`ctx.session` are non-null and exposes `ctx.userId`.
 */
export const authenticatedProcedure = tRPCContext.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to perform this action.",
    });
  }

  return next({
    ctx: {
      session: ctx.session,
      user: ctx.user,
      userId: ctx.user.id,
    },
  });
});
