import z from "zod";

const MemberRoleSchema = z
  .enum(["owner", "admin", "member", "viewer"])
  .describe("role of the member within the organization");

export const createInvitaionInput = z.object({
  organizationId: z.string().describe("Id of the organization"),
  email: z.email().describe("Email of the invitee"),
  role: MemberRoleSchema.default("member"),
  invitedByUserId: z.string().describe("Id of of the inviter"),
});

export type CreateInvitaion = z.infer<typeof createInvitaionInput>;

export const InvitationStatus = z.enum(["pending", "accepted", "revoked", "expired"]);
export const listInvitations = z.object({
  organizationId: z.string().describe("ID of the organization"),
  status: InvitationStatus.describe("Status of the invited user"),
});


export type ListInvitations = z.infer<typeof listInvitations>;

export const invitationTokenInput = z.object({
  token: z.string().describe("Invitation token from the invite link"),
});
export type InvitationToken = z.infer<typeof invitationTokenInput>;

export const acceptInvitationInput = z.object({
  token: z.string().describe("Invitation token from the invite link"),
  userId: z.string().describe("Id of the user accepting (from the session)"),
});
export type AcceptInvitation = z.infer<typeof acceptInvitationInput>;

export const invitationIdInput = z.object({
  id: z.string().describe("Id of the invitation"),
});
export type InvitationId = z.infer<typeof invitationIdInput>;