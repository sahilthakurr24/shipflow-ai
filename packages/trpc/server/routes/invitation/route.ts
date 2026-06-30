import { TRPCError } from "@trpc/server";

import { invitationService, organizationService, userService } from "../../services";
import { authenticatedProcedure, router } from "../../trpc";
import { assertOrgAccess } from "../../utils/authz";
import { generatePath } from "../../utils/path-generator";
import {
  acceptInvitationInput,
  acceptInvitationOutput,
  createInvitationInput,
  createInvitationOutput,
  getInvitationOutput,
  invitationIdInput,
  invitationTokenInput,
  listInvitationsInput,
  listInvitationsOutput,
  revokeInvitationOutput,
} from "./model";

const TAGS = ["Invitations"];
const getPath = generatePath("/invitations");

const MANAGE_ROLES = ["owner", "admin"] as const;

export const invitationRouter = router({
  createInvitation: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/"), tags: TAGS } })
    .input(createInvitationInput)
    .output(createInvitationOutput)
    .mutation(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId, MANAGE_ROLES);

      // invitedByUserId is the authenticated inviter, never the client.
      return invitationService.createInvitation({ ...input, invitedByUserId: ctx.userId });
    }),

  listInvitations: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/list"), tags: TAGS } })
    .input(listInvitationsInput)
    .output(listInvitationsOutput)
    .query(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId, MANAGE_ROLES);
      const { results } = await invitationService.listInvitations(input);

      return { invitations: results };
    }),

  getInvitationByToken: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/by-token"), tags: TAGS } })
    .input(invitationTokenInput)
    .output(getInvitationOutput)
    .query(async ({ input }) => {
      // Any authenticated user holding the token may view it (to accept it).
      const { invitation } = await invitationService.getInvitationByToken(input);
      if (!invitation) {
        return { invitation: undefined, organization: null, invitedByName: null };
      }

      // Enrich with the org name + inviter so the accept page can render context
      // (the invitee isn't a member yet, so they can't fetch the org directly).
      const org = await organizationService.getOrganizationById({ id: invitation.organizationId });
      let invitedByName: string | null = null;
      if (invitation.invitedByUserId) {
        const { user } = await userService.getUserById({ id: invitation.invitedByUserId });
        invitedByName = user?.fullName ?? null;
      }

      return {
        invitation,
        organization: org ? { id: org.id, name: org.name } : null,
        invitedByName,
      };
    }),

  acceptInvitation: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/accept"), tags: TAGS } })
    .input(acceptInvitationInput)
    .output(acceptInvitationOutput)
    .mutation(async ({ ctx, input }) => {
      // The accepting user is always the session user (email-bound in the service).
      return invitationService.acceptInvitation({ token: input.token, userId: ctx.userId });
    }),

  revokeInvitation: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/revoke"), tags: TAGS } })
    .input(invitationIdInput)
    .output(revokeInvitationOutput)
    .mutation(async ({ ctx, input }) => {
      const { invitation } = await invitationService.getInvitationById(input);

      if (!invitation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found." });
      }

      await assertOrgAccess(ctx.userId, invitation.organizationId, MANAGE_ROLES);

      return invitationService.revokeInvitation(input);
    }),
});
