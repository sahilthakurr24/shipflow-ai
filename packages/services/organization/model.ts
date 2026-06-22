import z from "zod";

export const createOrganizationInput = z.object({
  name: z
    .string()
    .describe("name of the organization")
    .min(4, "Minimum 4 chars should be there")
    .max(20, "Maximum 20 chars are allowed"),
});

export type CreateOrganizationInputType = z.infer<typeof createOrganizationInput>;

export const organizationIdInput = z.object({
  id: z.uuid().describe("id of the organization"),
});

export type OrganizationIdInputType = z.infer<typeof organizationIdInput>;

export const organizationSlugInput = z.object({
  slug: z.string().describe("slug of the organization"),
});

export type OrganizationSlugInputType = z.infer<typeof organizationSlugInput>;

export const updateOrganizationInput = z.object({
  id: z.uuid().describe("id of the organization"),
  name: z
    .string()
    .describe("name of the organization")
    .min(4, "Minimum 4 chars should be there")
    .max(20, "Maximum 20 chars are allowed")
    .optional(),
  logoUrl: z.url().describe("logo url of the organization").optional(),
});

export type UpdateOrganizationInputType = z.infer<typeof updateOrganizationInput>;
