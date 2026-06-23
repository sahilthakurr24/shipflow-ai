import { db, and, eq } from "@repo/database";
import { prdsTable } from "@repo/database/schema";
import {
  createPrdInput,
  CreatePrdInputType,
  listPrdsInput,
  ListPrdsInputType,
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
}

export default PrdService;
