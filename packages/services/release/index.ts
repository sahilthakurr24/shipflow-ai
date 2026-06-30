import { db, and, eq } from "@repo/database";
import { releasesTable } from "@repo/database/schema";
import {
  createReleaseInput,
  CreateReleaseInputType,
  listReleasesInput,
  ListReleasesInputType,
  releaseIdInput,
  ReleaseIdInputType,
  updateReleaseInput,
  UpdateReleaseInputType,
} from "./model";

class ReleaseService {
  public async createRelease(payload: CreateReleaseInputType) {
    const parsed = await createReleaseInput.parseAsync(payload);

    // Stamp the ship time when a release is created already shipped (the gated
    // ship action), mirroring updateRelease.
    const values = parsed.status === "shipped" ? { ...parsed, shippedAt: new Date() } : parsed;

    const [result] = await db
      .insert(releasesTable)
      .values(values)
      .returning({ id: releasesTable.id });

    return { id: result?.id };
  }

  public async getReleaseById(payload: ReleaseIdInputType) {
    const { id } = await releaseIdInput.parseAsync(payload);

    const [result] = await db.select().from(releasesTable).where(eq(releasesTable.id, id));

    return { release: result };
  }

  public async listReleases(payload: ListReleasesInputType) {
    const { organizationId, featureRequestId } = await listReleasesInput.parseAsync(payload);

    const conditions = [eq(releasesTable.organizationId, organizationId)];
    if (featureRequestId) conditions.push(eq(releasesTable.featureRequestId, featureRequestId));

    const releases = await db
      .select()
      .from(releasesTable)
      .where(and(...conditions));

    return { releases };
  }

  public async updateRelease(payload: UpdateReleaseInputType) {
    const { id, ...fields } = await updateReleaseInput.parseAsync(payload);

    // Stamp the ship time when a release transitions to shipped.
    const values = fields.status === "shipped" ? { ...fields, shippedAt: new Date() } : fields;

    const [result] = await db
      .update(releasesTable)
      .set(values)
      .where(eq(releasesTable.id, id))
      .returning({ id: releasesTable.id });

    return { id: result?.id };
  }

  public async deleteRelease(payload: ReleaseIdInputType) {
    const { id } = await releaseIdInput.parseAsync(payload);

    await db.delete(releasesTable).where(eq(releasesTable.id, id));
  }
}

export default ReleaseService;
