import z from "zod";
import { releaseStatusEnum } from "@repo/database/schema";

export const releaseStatusSchema = z.enum(releaseStatusEnum.enumValues);

export const createReleaseInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
  featureRequestId: z.uuid().describe("id of the feature request"),
  pullRequestId: z.uuid().optional(),
  approvalId: z.uuid().optional(),
  status: releaseStatusSchema.optional(),
  version: z.string().max(50).optional(),
  releaseNotes: z.string().optional(),
  shippedByUserId: z.uuid().optional(),
});

export type CreateReleaseInputType = z.infer<typeof createReleaseInput>;

export const releaseIdInput = z.object({ id: z.uuid().describe("id of the release") });
export type ReleaseIdInputType = z.infer<typeof releaseIdInput>;

export const listReleasesInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
  featureRequestId: z.uuid().optional(),
});
export type ListReleasesInputType = z.infer<typeof listReleasesInput>;

export const updateReleaseInput = z.object({
  id: z.uuid().describe("id of the release"),
  status: releaseStatusSchema.optional(),
  version: z.string().max(50).optional(),
  releaseNotes: z.string().optional(),
  shippedByUserId: z.uuid().optional(),
});

export type UpdateReleaseInputType = z.infer<typeof updateReleaseInput>;
