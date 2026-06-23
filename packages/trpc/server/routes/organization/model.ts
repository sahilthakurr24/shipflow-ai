import z from "zod";
import { memberRoleSchema } from "@repo/services/membership/model";

export {
  createOrganizationInput,
  organizationIdInput,
  organizationSlugInput,
  updateOrganizationInput,
} from "@repo/services/organization/model";

export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logoUrl: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const userOrganizationSchema = organizationSchema.extend({
  role: memberRoleSchema,
});

export const createOrganizationOutput = z.object({
  id: z.string(),
});

export const getOrganizationOutput = z.object({
  organization: organizationSchema.optional(),
});

export const getUserOrganizationsOutput = z.object({
  organizations: z.array(userOrganizationSchema),
});

export const updateOrganizationOutput = z.object({
  id: z.string().optional(),
});

export const deleteOrganizationOutput = z.object({
  success: z.boolean(),
});
