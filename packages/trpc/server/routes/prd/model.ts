import z from "zod";
import { prdStatusSchema } from "@repo/services/prd/model";

export {
  createPrdInput,
  prdIdInput,
  listPrdsInput,
  updatePrdInput,
  createUserStoryInput,
  listUserStoriesInput,
  createAcceptanceCriteriaInput,
  listAcceptanceCriteriaInput,
} from "@repo/services/prd/model";

const stringArray = z.array(z.string());

export const prdSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  featureRequestId: z.string(),
  version: z.number(),
  status: prdStatusSchema,
  title: z.string(),
  problemStatement: z.string().nullable(),
  goals: stringArray,
  nonGoals: stringArray,
  edgeCases: stringArray,
  assumptions: stringArray,
  successMetrics: stringArray,
  generatedByModel: z.string().nullable(),
  approvedByUserId: z.string().nullable(),
  approvedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createPrdOutput = z.object({ id: z.string() });
export const getPrdOutput = z.object({ prd: prdSchema.optional() });
export const listPrdsOutput = z.object({ prds: z.array(prdSchema) });
export const updatePrdOutput = z.object({ id: z.string().optional() });
export const deletePrdOutput = z.object({ success: z.boolean() });

export const userStorySchema = z.object({
  id: z.string(),
  prdId: z.string(),
  asA: z.string().nullable(),
  iWant: z.string().nullable(),
  soThat: z.string().nullable(),
  narrative: z.string().nullable(),
  orderIndex: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const acceptanceCriteriaSchema = z.object({
  id: z.string(),
  prdId: z.string(),
  userStoryId: z.string().nullable(),
  description: z.string(),
  orderIndex: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createUserStoryOutput = z.object({ id: z.string() });
export const listUserStoriesOutput = z.object({ userStories: z.array(userStorySchema) });
export const createAcceptanceCriteriaOutput = z.object({ id: z.string() });
export const listAcceptanceCriteriaOutput = z.object({
  acceptanceCriteria: z.array(acceptanceCriteriaSchema),
});
