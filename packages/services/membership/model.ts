import z from "zod";

export const memberRoleSchema = z
  .enum(["owner", "admin", "member", "viewer"])
  .describe("role of the member within the organization");

export type MemberRoleType = z.infer<typeof memberRoleSchema>;

export const createMembershipInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
  userId: z.uuid().describe("id of the user"),
  role: memberRoleSchema.default("member"),
});

export type CreateMembershipInputType = z.infer<typeof createMembershipInput>;

export const membershipIdentifierInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
  userId: z.uuid().describe("id of the user"),
});

export type MembershipIdentifierInputType = z.infer<typeof membershipIdentifierInput>;

export const updateMemberRoleInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
  userId: z.uuid().describe("id of the user"),
  role: memberRoleSchema,
});

export type UpdateMemberRoleInputType = z.infer<typeof updateMemberRoleInput>;

export const leaveOrganizationInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
  userId: z.uuid().describe("id of the user leaving"),
});

export type LeaveOrganizationInputType = z.infer<typeof leaveOrganizationInput>;
