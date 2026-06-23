import { db, and, eq } from "@repo/database";
import { approvalsTable } from "@repo/database/schema";
import {
  approvalIdInput,
  ApprovalIdInputType,
  createApprovalInput,
  CreateApprovalInputType,
  listApprovalsInput,
  ListApprovalsInputType,
} from "./model";

class ApprovalService {
  public async createApproval(payload: CreateApprovalInputType) {
    const values = await createApprovalInput.parseAsync(payload);

    const [result] = await db
      .insert(approvalsTable)
      .values(values)
      .returning({ id: approvalsTable.id });

    return { id: result?.id };
  }

  public async getApprovalById(payload: ApprovalIdInputType) {
    const { id } = await approvalIdInput.parseAsync(payload);

    const [result] = await db.select().from(approvalsTable).where(eq(approvalsTable.id, id));

    return { approval: result };
  }

  public async listApprovals(payload: ListApprovalsInputType) {
    const { organizationId, featureRequestId } = await listApprovalsInput.parseAsync(payload);

    const conditions = [eq(approvalsTable.organizationId, organizationId)];
    if (featureRequestId) conditions.push(eq(approvalsTable.featureRequestId, featureRequestId));

    const approvals = await db
      .select()
      .from(approvalsTable)
      .where(and(...conditions));

    return { approvals };
  }

  public async deleteApproval(payload: ApprovalIdInputType) {
    const { id } = await approvalIdInput.parseAsync(payload);

    await db.delete(approvalsTable).where(eq(approvalsTable.id, id));
  }
}

export default ApprovalService;
