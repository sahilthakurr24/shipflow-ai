import z from "zod";
import { InvitationStatus } from "@repo/services/invitation/model";
import { memberRoleSchema } from "@repo/services/membership/model";

// Route-facing inputs — server-supplied fields (invitedByUserId, the accepting
// userId) are taken from ctx, not the client.
export const createInvitationInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
  email: z.email().describe("email of the invitee"),
  role: memberRoleSchema.default("member"),
});

export const listInvitationsInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
  status: InvitationStatus.default("pending"),
});

export const invitationTokenInput = z.object({
  token: z.string().describe("invitation token from the invite link"),
});

export const acceptInvitationInput = z.object({
  token: z.string().describe("invitation token from the invite link"),
});

export const invitationIdInput = z.object({
  id: z.uuid().describe("id of the invitation"),
});

export const invitationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  email: z.string(),
  role: memberRoleSchema,
  token: z.string(),
  status: InvitationStatus,
  invitedByUserId: z.string().nullable(),
  expiresAt: z.date(),
  acceptedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createInvitationOutput = z.object({
  invitation: z.object({ id: z.string(), token: z.string() }).optional(),
});
export const listInvitationsOutput = z.object({ invitations: z.array(invitationSchema) });
export const getInvitationOutput = z.object({
  invitation: invitationSchema.optional(),
  organization: z.object({ id: z.string(), name: z.string() }).nullable(),
  invitedByName: z.string().nullable(),
});
export const acceptInvitationOutput = z.object({
  organizationId: z.string(),
  role: memberRoleSchema,
});
export const revokeInvitationOutput = z.object({ id: z.string().optional() });
