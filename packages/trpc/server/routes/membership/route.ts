import { membershipService } from "../../services";
import { authenticatedProcedure, router } from "../../trpc";
import { assertOrgAccess } from "../../utils/authz";
import { generatePath } from "../../utils/path-generator";
import {
  addMemberOutput,
  createMembershipInput,
  getMembershipOutput,
  listOrganizationMembersOutput,
  membershipIdentifierInput,
  organizationMembersInput,
  removeMemberOutput,
  updateMemberRoleInput,
  updateMemberRoleOutput,
} from "./model";

const TAGS = ["Memberships"];
const getPath = generatePath("/memberships");

const MANAGE_ROLES = ["owner", "admin"] as const;

export const membershipRouter = router({
  addMember: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/"), tags: TAGS } })
    .input(createMembershipInput)
    .output(addMemberOutput)
    .mutation(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId, MANAGE_ROLES);
      const id = await membershipService.createMembership(input);

      return { id };
    }),

  getMembership: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/get"), tags: TAGS } })
    .input(membershipIdentifierInput)
    .output(getMembershipOutput)
    .query(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId);
      const membership = await membershipService.getMembership(input);

      return { membership };
    }),

  listOrganizationMembers: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/list"), tags: TAGS } })
    .input(organizationMembersInput)
    .output(listOrganizationMembersOutput)
    .query(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId);
      const members = await membershipService.listOrganizationMembers(input.organizationId);

      return { members };
    }),

  updateMemberRole: authenticatedProcedure
    .meta({ openapi: { method: "PATCH", path: getPath("/role"), tags: TAGS } })
    .input(updateMemberRoleInput)
    .output(updateMemberRoleOutput)
    .mutation(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId, MANAGE_ROLES);
      const id = await membershipService.updateMemberRole(input);

      return { id };
    }),

  removeMember: authenticatedProcedure
    .meta({ openapi: { method: "DELETE", path: getPath("/"), tags: TAGS } })
    .input(membershipIdentifierInput)
    .output(removeMemberOutput)
    .mutation(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId, MANAGE_ROLES);
      await membershipService.removeMember(input);

      return { success: true };
    }),
});
