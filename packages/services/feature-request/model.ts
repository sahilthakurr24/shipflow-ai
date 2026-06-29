import z from "zod";
import {
  buildDecisionEnum,
  clarificationRoleEnum,
  featureRequestSourceEnum,
  featureRequestStatusEnum,
  priorityEnum,
} from "@repo/database/schema";

export const clarificationRoleSchema = z.enum(clarificationRoleEnum.enumValues);

export const featureRequestSourceSchema = z.enum(featureRequestSourceEnum.enumValues);
export const featureRequestStatusSchema = z.enum(featureRequestStatusEnum.enumValues);
export const featureRequestPrioritySchema = z.enum(priorityEnum.enumValues);
export const buildDecisionSchema = z.enum(buildDecisionEnum.enumValues);

export const createFeatureRequestInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
  projectId: z.uuid().describe("id of the project").optional(),
  repositoryId: z.uuid().describe("id of the target repository (AI code context)").optional(),
  title: z.string().min(1).max(200).describe("title of the feature request"),
  description: z.string().min(1).describe("description of the feature request"),
  source: featureRequestSourceSchema.optional(),
  priority: featureRequestPrioritySchema.optional(),
  requesterName: z.string().max(120).optional(),
  requesterEmail: z.email().optional(),
  externalReference: z.string().max(255).optional(),
  createdByUserId: z.uuid().optional(),
});

export type CreateFeatureRequestInputType = z.infer<typeof createFeatureRequestInput>;

export const featureRequestIdInput = z.object({
  id: z.uuid().describe("id of the feature request"),
});

export type FeatureRequestIdInputType = z.infer<typeof featureRequestIdInput>;

export const listFeatureRequestsInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
});

export type ListFeatureRequestsInputType = z.infer<typeof listFeatureRequestsInput>;

export const updateFeatureRequestInput = z.object({
  id: z.uuid().describe("id of the feature request"),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  status: featureRequestStatusSchema.optional(),
  priority: featureRequestPrioritySchema.optional(),
  buildDecision: buildDecisionSchema.optional(),
  buildDecisionRationale: z.string().optional(),
  assignedToUserId: z.uuid().optional(),
});

export type UpdateFeatureRequestInputType = z.infer<typeof updateFeatureRequestInput>;

export const addClarificationMessageInput = z.object({
  featureRequestId: z.uuid().describe("id of the feature request"),
  role: clarificationRoleSchema,
  content: z.string().min(1).describe("message content"),
});

export type AddClarificationMessageInputType = z.infer<typeof addClarificationMessageInput>;

export const listClarificationMessagesInput = z.object({
  featureRequestId: z.uuid().describe("id of the feature request"),
});

export type ListClarificationMessagesInputType = z.infer<typeof listClarificationMessagesInput>;
