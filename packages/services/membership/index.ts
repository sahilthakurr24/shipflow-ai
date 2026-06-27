import { db, and, eq } from "@repo/database";
import { membershipsTable, usersTable } from "@repo/database/schema";
import {
  createMembershipInput,
  CreateMembershipInputType,
  leaveOrganizationInput,
  LeaveOrganizationInputType,
  membershipIdentifierInput,
  MembershipIdentifierInputType,
  updateMemberRoleInput,
  UpdateMemberRoleInputType,
} from "./model";

class MembershipService {
  public async createMembership(payload: CreateMembershipInputType) {
    const { organizationId, userId, role } = await createMembershipInput.parseAsync(payload);

    const [result] = await db
      .insert(membershipsTable)
      .values({
        organizationId,
        userId,
        role,
      })
      .returning({ id: membershipsTable.id });

    return result?.id;
  }

  public async getMembership(payload: MembershipIdentifierInputType) {
    const { organizationId, userId } = await membershipIdentifierInput.parseAsync(payload);

    const [result] = await db
      .select()
      .from(membershipsTable)
      .where(
        and(
          eq(membershipsTable.organizationId, organizationId),
          eq(membershipsTable.userId, userId),
        ),
      );

    return result;
  }

  public async listOrganizationMembers(organizationId: string) {
    const results = await db
      .select({
        userId: usersTable.id,
        fullName: usersTable.fullName,
        email: usersTable.email,
        profileImageUrl: usersTable.profileImageUrl,
        role: membershipsTable.role,
        joinedAt: membershipsTable.createdAt,
      })
      .from(membershipsTable)
      .innerJoin(usersTable, eq(membershipsTable.userId, usersTable.id))
      .where(eq(membershipsTable.organizationId, organizationId));

    return results;
  }

  public async updateMemberRole(payload: UpdateMemberRoleInputType) {
    const { organizationId, userId, role } = await updateMemberRoleInput.parseAsync(payload);

    const [result] = await db
      .update(membershipsTable)
      .set({ role })
      .where(
        and(
          eq(membershipsTable.organizationId, organizationId),
          eq(membershipsTable.userId, userId),
        ),
      )
      .returning({ id: membershipsTable.id });

    return result?.id;
  }

  public async removeMember(payload: MembershipIdentifierInputType) {
    const { organizationId, userId } = await membershipIdentifierInput.parseAsync(payload);

    await db
      .delete(membershipsTable)
      .where(
        and(
          eq(membershipsTable.organizationId, organizationId),
          eq(membershipsTable.userId, userId),
        ),
      );
  }

  /**
   * Self-service leave: a member removes their own membership. The sole owner
   * cannot leave (they must transfer ownership or delete the org instead).
   */
  public async leaveOrganization(payload: LeaveOrganizationInputType) {
    const { organizationId, userId } = await leaveOrganizationInput.parseAsync(payload);

    const [membership] = await db
      .select({ role: membershipsTable.role })
      .from(membershipsTable)
      .where(
        and(
          eq(membershipsTable.organizationId, organizationId),
          eq(membershipsTable.userId, userId),
        ),
      );

    if (!membership) {
      throw new Error("You are not a member of this organization.");
    }

    if (membership.role === "owner") {
      const owners = await db
        .select({ id: membershipsTable.id })
        .from(membershipsTable)
        .where(
          and(
            eq(membershipsTable.organizationId, organizationId),
            eq(membershipsTable.role, "owner"),
          ),
        );

      if (owners.length <= 1) {
        throw new Error(
          "You are the only owner. Transfer ownership or delete the organization instead.",
        );
      }
    }

    await db
      .delete(membershipsTable)
      .where(
        and(
          eq(membershipsTable.organizationId, organizationId),
          eq(membershipsTable.userId, userId),
        ),
      );
  }
}

export default MembershipService;
