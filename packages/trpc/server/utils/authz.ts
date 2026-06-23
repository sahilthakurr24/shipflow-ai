import { TRPCError } from "@trpc/server";
import type { MemberRoleType } from "@repo/services/membership/model";

import { membershipService } from "../services";

/**
 * Ensures `userId` is a member of `organizationId` (optionally with one of
 * `allowedRoles`) and returns their membership. Throws FORBIDDEN otherwise.
 * Used by org/membership procedures on top of `authenticatedProcedure`.
 *
 * Common role sets: read = any member (omit `allowedRoles`),
 * manage = ["owner", "admin"], destroy = ["owner"].
 */
export async function assertOrgAccess(
  userId: string,
  organizationId: string,
  allowedRoles?: ReadonlyArray<MemberRoleType>,
) {
  const membership = await membershipService.getMembership({ organizationId, userId });

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of this organization.",
    });
  }

  if (allowedRoles && !allowedRoles.includes(membership.role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action.",
    });
  }

  return membership;
}
