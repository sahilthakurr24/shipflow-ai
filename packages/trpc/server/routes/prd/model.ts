import z from "zod";
import { prdStatusSchema } from "@repo/services/prd/model";

export {
  createPrdInput,
  prdIdInput,
  listPrdsInput,
  updatePrdInput,
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
