import { db, eq } from "@repo/database";
import { clarificationMessagesTable, featureRequestsTable } from "@repo/database/schema";
import {
  addClarificationMessageInput,
  AddClarificationMessageInputType,
  createFeatureRequestInput,
  CreateFeatureRequestInputType,
  featureRequestIdInput,
  FeatureRequestIdInputType,
  listClarificationMessagesInput,
  ListClarificationMessagesInputType,
  listFeatureRequestsInput,
  ListFeatureRequestsInputType,
  updateFeatureRequestInput,
  UpdateFeatureRequestInputType,
} from "./model";

class FeatureRequestService {
  public async createFeatureRequest(payload: CreateFeatureRequestInputType) {
    const values = await createFeatureRequestInput.parseAsync(payload);

    const [result] = await db
      .insert(featureRequestsTable)
      .values(values)
      .returning({ id: featureRequestsTable.id });

    return { id: result?.id };
  }

  public async getFeatureRequestById(payload: FeatureRequestIdInputType) {
    const { id } = await featureRequestIdInput.parseAsync(payload);

    const [result] = await db
      .select()
      .from(featureRequestsTable)
      .where(eq(featureRequestsTable.id, id));

    return { featureRequest: result };
  }

  public async listFeatureRequests(payload: ListFeatureRequestsInputType) {
    const { organizationId } = await listFeatureRequestsInput.parseAsync(payload);

    const featureRequests = await db
      .select()
      .from(featureRequestsTable)
      .where(eq(featureRequestsTable.organizationId, organizationId));

    return { featureRequests };
  }

  public async updateFeatureRequest(payload: UpdateFeatureRequestInputType) {
    const { id, ...fields } = await updateFeatureRequestInput.parseAsync(payload);

    const [result] = await db
      .update(featureRequestsTable)
      .set(fields)
      .where(eq(featureRequestsTable.id, id))
      .returning({ id: featureRequestsTable.id });

    return { id: result?.id };
  }

  public async deleteFeatureRequest(payload: FeatureRequestIdInputType) {
    const { id } = await featureRequestIdInput.parseAsync(payload);

    await db.delete(featureRequestsTable).where(eq(featureRequestsTable.id, id));
  }

  public async addClarificationMessage(payload: AddClarificationMessageInputType) {
    const values = await addClarificationMessageInput.parseAsync(payload);

    const [result] = await db
      .insert(clarificationMessagesTable)
      .values(values)
      .returning({ id: clarificationMessagesTable.id });

    return { id: result?.id };
  }

  public async listClarificationMessages(payload: ListClarificationMessagesInputType) {
    const { featureRequestId } = await listClarificationMessagesInput.parseAsync(payload);

    const messages = await db
      .select()
      .from(clarificationMessagesTable)
      .where(eq(clarificationMessagesTable.featureRequestId, featureRequestId));

    return { messages };
  }
}

export default FeatureRequestService;
