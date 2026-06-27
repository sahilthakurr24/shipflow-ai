import z from "zod";
import { memberRoleSchema } from "@repo/services/membership/model";

export {
  createMembershipInput,
  membershipIdentifierInput,
  updateMemberRoleInput,
} from "@repo/services/membership/model";

export const membershipSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  role: memberRoleSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const orgMemberSchema = z.object({
  userId: z.string(),
  fullName: z.string(),
  email: z.string(),
  profileImageUrl: z.string().nullable(),
  role: memberRoleSchema,
  joinedAt: z.date(),
});

export const addMemberOutput = z.object({
  id: z.string().optional(),
});

export const getMembershipOutput = z.object({
  membership: membershipSchema.optional(),
});

export const listOrganizationMembersOutput = z.object({
  members: z.array(orgMemberSchema),
});

export const updateMemberRoleOutput = z.object({
  id: z.string().optional(),
});

export const removeMemberOutput = z.object({
  success: z.boolean(),
});

export const organizationMembersInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
});

export const leaveOrganizationInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
});

export const leaveOrganizationOutput = z.object({
  success: z.boolean(),
});
