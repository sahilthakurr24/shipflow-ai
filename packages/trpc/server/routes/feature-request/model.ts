import z from "zod";
import {
  buildDecisionSchema,
  featureRequestPrioritySchema,
  featureRequestSourceSchema,
  featureRequestStatusSchema,
} from "@repo/services/feature-request/model";

export {
  createFeatureRequestInput,
  featureRequestIdInput,
  listFeatureRequestsInput,
  updateFeatureRequestInput,
} from "@repo/services/feature-request/model";

export const featureRequestSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string().nullable(),
  title: z.string(),
  description: z.string(),
  source: featureRequestSourceSchema,
  status: featureRequestStatusSchema,
  priority: featureRequestPrioritySchema,
  buildDecision: buildDecisionSchema,
  buildDecisionRationale: z.string().nullable(),
  requesterName: z.string().nullable(),
  requesterEmail: z.string().nullable(),
  externalReference: z.string().nullable(),
  createdByUserId: z.string().nullable(),
  assignedToUserId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createFeatureRequestOutput = z.object({ id: z.string() });
export const getFeatureRequestOutput = z.object({ featureRequest: featureRequestSchema.optional() });
export const listFeatureRequestsOutput = z.object({
  featureRequests: z.array(featureRequestSchema),
});
export const updateFeatureRequestOutput = z.object({ id: z.string().optional() });
export const deleteFeatureRequestOutput = z.object({ success: z.boolean() });
