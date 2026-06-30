import crypto from "node:crypto";
import {
  acceptInvitationInput,
  AcceptInvitation,
  CreateInvitaion,
  createInvitaionInput,
  invitationIdInput,
  InvitationId,
  invitationTokenInput,
  InvitationToken,
  listInvitations,
  ListInvitations,
} from "./model";
import db, { and, eq } from "@repo/database";
import { invitationsTable, membershipsTable, usersTable } from "@repo/database/schema";

class InvivationService {
  private generateToken() {
    return crypto.randomBytes(32).toString("hex");
  }
  public async createInvitation(payload: CreateInvitaion) {
    const { organizationId, email, role, invitedByUserId } =
      await createInvitaionInput.parseAsync(payload);

    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [alreadyInvited] = await db
      .select()
      .from(invitationsTable)
      .where(
        and(
          eq(invitationsTable.email, email),
          eq(invitationsTable.organizationId, organizationId),
          eq(invitationsTable.status, "pending"),
        ),
      );
    if (alreadyInvited) {
      throw new Error("User already invited");
    }

    const result = await db
      .insert(invitationsTable)
      .values({
        organizationId,
        email,
        role,
        token,
        expiresAt,
        invitedByUserId,
        status: "pending",
      })
      .returning({
        id: invitationsTable.id,
        token: invitationsTable.token,
      });

    return { invitation: result[0] };
  }

  public async listInvitations(payload: ListInvitations) {
    const { organizationId, status } = await listInvitations.parseAsync(payload);

    const results = await db
      .select()
      .from(invitationsTable)
      .where(
        and(
          eq(invitationsTable.organizationId, organizationId),
          eq(invitationsTable.status, status),
        ),
      );

    return { results };
  }

  public async getInvitationByToken(payload: InvitationToken) {
    const { token } = await invitationTokenInput.parseAsync(payload);

    const [invitation] = await db
      .select()
      .from(invitationsTable)
      .where(eq(invitationsTable.token, token));

    return { invitation };
  }

  public async getInvitationById(payload: InvitationId) {
    const { id } = await invitationIdInput.parseAsync(payload);

    const [invitation] = await db
      .select()
      .from(invitationsTable)
      .where(eq(invitationsTable.id, id));

    return { invitation };
  }

  public async acceptInvitation(payload: AcceptInvitation) {
    const { token, userId } = await acceptInvitationInput.parseAsync(payload);

    const [invitation] = await db
      .select()
      .from(invitationsTable)
      .where(eq(invitationsTable.token, token));

    if (!invitation) {
      throw new Error("Invitation not found");
    }
    if (invitation.status !== "pending") {
      throw new Error("This invitation is no longer valid");
    }
    if (invitation.expiresAt.getTime() < Date.now()) {
      // Lazily flip stale invites to expired so the link stops working.
      await db
        .update(invitationsTable)
        .set({ status: "expired" })
        .where(eq(invitationsTable.id, invitation.id));
      throw new Error("This invitation has expired");
    }

    // Email-bound: only the invited address can accept.
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      throw new Error("User not found");
    }
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new Error("This invitation was sent to a different email address");
    }

    // Create the membership unless they're already a member (unique org+user).
    const [existing] = await db
      .select()
      .from(membershipsTable)
      .where(
        and(
          eq(membershipsTable.organizationId, invitation.organizationId),
          eq(membershipsTable.userId, userId),
        ),
      );

    if (!existing) {
      await db.insert(membershipsTable).values({
        organizationId: invitation.organizationId,
        userId,
        role: invitation.role,
      });
    }

    await db
      .update(invitationsTable)
      .set({ status: "accepted", acceptedAt: new Date() })
      .where(eq(invitationsTable.id, invitation.id));

    return { organizationId: invitation.organizationId, role: invitation.role };
  }

  public async revokeInvitation(payload: InvitationId) {
    const { id } = await invitationIdInput.parseAsync(payload);

    const [result] = await db
      .update(invitationsTable)
      .set({ status: "revoked" })
      .where(eq(invitationsTable.id, id))
      .returning({ id: invitationsTable.id });

    return { id: result?.id };
  }
}

export default InvivationService;
