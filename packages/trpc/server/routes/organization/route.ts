import { TRPCError } from "@trpc/server";

import { zodUndefinedModel } from "../../schema";
import { organizationService, membershipService } from "../../services";
import { authenticatedProcedure, router } from "../../trpc";
import { assertOrgAccess } from "../../utils/authz";
import { generatePath } from "../../utils/path-generator";
import {
  createOrganizationInput,
  createOrganizationOutput,
  deleteOrganizationOutput,
  getOrganizationOutput,
  getUserOrganizationsOutput,
  organizationIdInput,
  organizationSlugInput,
  updateOrganizationInput,
  updateOrganizationOutput,
} from "./model";

const TAGS = ["Organizations"];
const getPath = generatePath("/organizations");

export const organizationRouter = router({
  createOrganization: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/"), tags: TAGS } })
    .input(createOrganizationInput)
    .output(createOrganizationOutput)
    .mutation(async ({ ctx, input }) => {
      const id = await organizationService.createOrganization(input);

      if (!id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create organization.",
        });
      }

      // The creator becomes the organization's owner.
      await membershipService.createMembership({
        organizationId: id,
        userId: ctx.userId,
        role: "owner",
      });

      return { id };
    }),

  getUserOrganizations: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/mine"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(getUserOrganizationsOutput)
    .query(async ({ ctx }) => {
      const organizations = await organizationService.getUserOrganizations(ctx.userId);

      return { organizations };
    }),

  getOrganizationById: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/by-id"), tags: TAGS } })
    .input(organizationIdInput)
    .output(getOrganizationOutput)
    .query(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.id);
      const organization = await organizationService.getOrganizationById(input);

      return { organization };
    }),

  getOrganizationBySlug: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/by-slug"), tags: TAGS } })
    .input(organizationSlugInput)
    .output(getOrganizationOutput)
    .query(async ({ ctx, input }) => {
      const organization = await organizationService.getOrganizationBySlug(input);

      if (organization) {
        await assertOrgAccess(ctx.userId, organization.id);
      }

      return { organization };
    }),

  updateOrganization: authenticatedProcedure
    .meta({ openapi: { method: "PATCH", path: getPath("/"), tags: TAGS } })
    .input(updateOrganizationInput)
    .output(updateOrganizationOutput)
    .mutation(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.id, ["owner", "admin"]);
      const id = await organizationService.updateOrganization(input);

      return { id };
    }),

  deleteOrganization: authenticatedProcedure
    .meta({ openapi: { method: "DELETE", path: getPath("/"), tags: TAGS } })
    .input(organizationIdInput)
    .output(deleteOrganizationOutput)
    .mutation(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.id, ["owner"]);
      await organizationService.deleteOrganization(input);

      return { success: true };
    }),
});
