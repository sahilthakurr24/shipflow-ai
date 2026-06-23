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
