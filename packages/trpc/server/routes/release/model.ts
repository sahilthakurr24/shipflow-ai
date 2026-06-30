import z from "zod";
import { releaseStatusSchema } from "@repo/services/release/model";

export {
  createReleaseInput,
  releaseIdInput,
  listReleasesInput,
  updateReleaseInput,
  shipReleaseInput,
} from "@repo/services/release/model";

export const releaseSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  featureRequestId: z.string(),
  pullRequestId: z.string().nullable(),
  approvalId: z.string().nullable(),
  status: releaseStatusSchema,
  version: z.string().nullable(),
  releaseNotes: z.string().nullable(),
  shippedByUserId: z.string().nullable(),
  shippedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createReleaseOutput = z.object({ id: z.string() });
export const shipReleaseOutput = z.object({ id: z.string() });
export const getReleaseOutput = z.object({ release: releaseSchema.optional() });
export const listReleasesOutput = z.object({ releases: z.array(releaseSchema) });
export const updateReleaseOutput = z.object({ id: z.string().optional() });
export const deleteReleaseOutput = z.object({ success: z.boolean() });
