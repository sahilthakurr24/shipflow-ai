import { db, and, eq } from "@repo/database";
import { acceptanceCriteriaTable, prdsTable, userStoriesTable } from "@repo/database/schema";
import {
  createAcceptanceCriteriaInput,
  CreateAcceptanceCriteriaInputType,
  createPrdInput,
  CreatePrdInputType,
  createUserStoryInput,
  CreateUserStoryInputType,
  listAcceptanceCriteriaInput,
  ListAcceptanceCriteriaInputType,
  listPrdsInput,
  ListPrdsInputType,
  listUserStoriesInput,
  ListUserStoriesInputType,
  prdIdInput,
  PrdIdInputType,
  updatePrdInput,
  UpdatePrdInputType,
} from "./model";

class PrdService {
  public async createPrd(payload: CreatePrdInputType) {
    const values = await createPrdInput.parseAsync(payload);

    const [result] = await db.insert(prdsTable).values(values).returning({ id: prdsTable.id });

    return { id: result?.id };
  }

  public async getPrdById(payload: PrdIdInputType) {
    const { id } = await prdIdInput.parseAsync(payload);

    const [result] = await db.select().from(prdsTable).where(eq(prdsTable.id, id));

    return { prd: result };
  }

  public async listPrds(payload: ListPrdsInputType) {
    const { organizationId, featureRequestId } = await listPrdsInput.parseAsync(payload);

    const conditions = [eq(prdsTable.organizationId, organizationId)];
    if (featureRequestId) conditions.push(eq(prdsTable.featureRequestId, featureRequestId));

    const prds = await db
      .select()
      .from(prdsTable)
      .where(and(...conditions));

    return { prds };
  }

  public async updatePrd(payload: UpdatePrdInputType) {
    const { id, ...fields } = await updatePrdInput.parseAsync(payload);

    const [result] = await db
      .update(prdsTable)
      .set(fields)
      .where(eq(prdsTable.id, id))
      .returning({ id: prdsTable.id });

    return { id: result?.id };
  }

  public async deletePrd(payload: PrdIdInputType) {
    const { id } = await prdIdInput.parseAsync(payload);

    await db.delete(prdsTable).where(eq(prdsTable.id, id));
  }

  public async createUserStory(payload: CreateUserStoryInputType) {
    const values = await createUserStoryInput.parseAsync(payload);

    const [result] = await db
      .insert(userStoriesTable)
      .values(values)
      .returning({ id: userStoriesTable.id });

    return { id: result?.id };
  }

  public async listUserStories(payload: ListUserStoriesInputType) {
    const { prdId } = await listUserStoriesInput.parseAsync(payload);

    const userStories = await db
      .select()
      .from(userStoriesTable)
      .where(eq(userStoriesTable.prdId, prdId));

    return { userStories };
  }

  public async createAcceptanceCriteria(payload: CreateAcceptanceCriteriaInputType) {
    const values = await createAcceptanceCriteriaInput.parseAsync(payload);

    const [result] = await db
      .insert(acceptanceCriteriaTable)
      .values(values)
      .returning({ id: acceptanceCriteriaTable.id });

    return { id: result?.id };
  }

  public async listAcceptanceCriteria(payload: ListAcceptanceCriteriaInputType) {
    const { prdId } = await listAcceptanceCriteriaInput.parseAsync(payload);

    const acceptanceCriteria = await db
      .select()
      .from(acceptanceCriteriaTable)
      .where(eq(acceptanceCriteriaTable.prdId, prdId));

    return { acceptanceCriteria };
  }
}

export default PrdService;
