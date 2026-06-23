import type { IncomingMessage } from "node:http";
import { auth } from "@repo/auth";
import { fromNodeHeaders } from "@repo/auth";

/**
 * Per-request context for the tRPC router (hosted by the Express API). Resolves
 * the BetterAuth session from the incoming request cookies so procedures can
 * read `ctx.session` / `ctx.user`. `protectedProcedure` builds on this.
 */
export async function createContext({ req }: { req: IncomingMessage }) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  return {
    session,
    user: session?.user ?? null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
