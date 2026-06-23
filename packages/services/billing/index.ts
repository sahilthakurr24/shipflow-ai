import { db, eq } from "@repo/database";
import { paymentsTable, subscriptionsTable, usageRecordsTable } from "@repo/database/schema";
import { billingOrganizationInput, BillingOrganizationInputType } from "./model";

/**
 * Read-side billing service. Writes (subscription/payment lifecycle) are driven
 * by Razorpay webhooks, so the API exposes reads for the billing UI.
 */
class BillingService {
  public async getSubscription(payload: BillingOrganizationInputType) {
    const { organizationId } = await billingOrganizationInput.parseAsync(payload);

    const [subscription] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.organizationId, organizationId));

    return { subscription };
  }

  public async listPayments(payload: BillingOrganizationInputType) {
    const { organizationId } = await billingOrganizationInput.parseAsync(payload);

    const payments = await db
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.organizationId, organizationId));

    return { payments };
  }

  public async listUsageRecords(payload: BillingOrganizationInputType) {
    const { organizationId } = await billingOrganizationInput.parseAsync(payload);

    const usageRecords = await db
      .select()
      .from(usageRecordsTable)
      .where(eq(usageRecordsTable.organizationId, organizationId));

    return { usageRecords };
  }
}

export default BillingService;
