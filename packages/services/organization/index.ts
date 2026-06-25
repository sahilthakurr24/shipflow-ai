import { db, eq } from "@repo/database";
import slugify from "slugify";
import crypto from "node:crypto";
import {
  createOrganizationInput,
  CreateOrganizationInputType,
  organizationIdInput,
  OrganizationIdInputType,
  organizationSlugInput,
  OrganizationSlugInputType,
  updateOrganizationInput,
  UpdateOrganizationInputType,
} from "./model";
import { membershipsTable, organizationsTable } from "@repo/database/schema";

class OrganizationService {
  private generateSlug(name: string) {
    const baseSlug = slugify(name, {
      lower: true,
      strict: true,
    });

    return `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;
  }

  public async createOrganization(payload: CreateOrganizationInputType) {
    const { name } = await createOrganizationInput.parseAsync(payload);
    const slug = this.generateSlug(name);

    const [result] = await db
      .insert(organizationsTable)
      .values({
        name,
        slug,
      })
      .returning({ id: organizationsTable.id });

    return result?.id;
  }

  public async getOrganizationById(payload: OrganizationIdInputType) {
    const { id } = await organizationIdInput.parseAsync(payload);

    const [result] = await db
      .select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, id));

    return result;
  }

  public async getOrganizationBySlug(payload: OrganizationSlugInputType) {
    const { slug } = await organizationSlugInput.parseAsync(payload);

    const [result] = await db
      .select()
      .from(organizationsTable)
      .where(eq(organizationsTable.slug, slug));

    return result;
  }

  public async getUserOrganizations(userId: string) {
    const results = await db
      .select({
        id: organizationsTable.id,
        name: organizationsTable.name,
        slug: organizationsTable.slug,
        logoUrl: organizationsTable.logoUrl,
        role: membershipsTable.role,
        createdAt: organizationsTable.createdAt,
        updatedAt: organizationsTable.updatedAt,
      })
      .from(membershipsTable)
      .innerJoin(organizationsTable, eq(membershipsTable.organizationId, organizationsTable.id))
      .where(eq(membershipsTable.userId, userId));

    return results;
  }

  public async updateOrganization(payload: UpdateOrganizationInputType) {
    const { id, name, logoUrl } = await updateOrganizationInput.parseAsync(payload);

    const [result] = await db
      .update(organizationsTable)
      .set({ name, logoUrl })
      .where(eq(organizationsTable.id, id))
      .returning({ id: organizationsTable.id });

    return result?.id;
  }

  public async deleteOrganization(payload: OrganizationIdInputType) {
    const { id } = await organizationIdInput.parseAsync(payload);

    await db.delete(organizationsTable).where(eq(organizationsTable.id, id));
  }
}

export default OrganizationService;
