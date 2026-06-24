import z from "zod";
import { prdStatusEnum } from "@repo/database/schema";

export const prdStatusSchema = z.enum(prdStatusEnum.enumValues);
const stringArray = z.array(z.string());

export const createPrdInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
  featureRequestId: z.uuid().describe("id of the feature request"),
  title: z.string().min(1).max(200).describe("title of the PRD"),
  version: z.number().int().positive().optional(),
  problemStatement: z.string().optional(),
  goals: stringArray.optional(),
  nonGoals: stringArray.optional(),
  edgeCases: stringArray.optional(),
  assumptions: stringArray.optional(),
  successMetrics: stringArray.optional(),
  generatedByModel: z.string().max(100).optional(),
});

export type CreatePrdInputType = z.infer<typeof createPrdInput>;

export const prdIdInput = z.object({ id: z.uuid().describe("id of the PRD") });
export type PrdIdInputType = z.infer<typeof prdIdInput>;

export const listPrdsInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
  featureRequestId: z.uuid().optional(),
});
export type ListPrdsInputType = z.infer<typeof listPrdsInput>;

export const updatePrdInput = z.object({
  id: z.uuid().describe("id of the PRD"),
  status: prdStatusSchema.optional(),
  title: z.string().min(1).max(200).optional(),
  problemStatement: z.string().optional(),
  goals: stringArray.optional(),
  nonGoals: stringArray.optional(),
  edgeCases: stringArray.optional(),
  assumptions: stringArray.optional(),
  successMetrics: stringArray.optional(),
});

export type UpdatePrdInputType = z.infer<typeof updatePrdInput>;

export const approvePrdInput = z.object({
  id: z.uuid().describe("id of the PRD"),
  approvedByUserId: z.uuid().describe("id of the approving user"),
});
export type ApprovePrdInputType = z.infer<typeof approvePrdInput>;

export const createUserStoryInput = z.object({
  prdId: z.uuid().describe("id of the PRD"),
  asA: z.string().max(160).optional(),
  iWant: z.string().optional(),
  soThat: z.string().optional(),
  narrative: z.string().optional(),
  orderIndex: z.number().int().optional(),
});
export type CreateUserStoryInputType = z.infer<typeof createUserStoryInput>;

export const listUserStoriesInput = z.object({ prdId: z.uuid().describe("id of the PRD") });
export type ListUserStoriesInputType = z.infer<typeof listUserStoriesInput>;

export const createAcceptanceCriteriaInput = z.object({
  prdId: z.uuid().describe("id of the PRD"),
  userStoryId: z.uuid().optional(),
  description: z.string().min(1).describe("acceptance criterion"),
  orderIndex: z.number().int().optional(),
});
export type CreateAcceptanceCriteriaInputType = z.infer<typeof createAcceptanceCriteriaInput>;

export const listAcceptanceCriteriaInput = z.object({ prdId: z.uuid().describe("id of the PRD") });
export type ListAcceptanceCriteriaInputType = z.infer<typeof listAcceptanceCriteriaInput>;
