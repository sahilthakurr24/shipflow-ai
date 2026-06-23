import { TRPCError } from "@trpc/server";

import { prdService } from "../../services";
import { authenticatedProcedure, router } from "../../trpc";
import { assertOrgAccess } from "../../utils/authz";
import { generatePath } from "../../utils/path-generator";
import {
  createAcceptanceCriteriaInput,
  createAcceptanceCriteriaOutput,
  createPrdInput,
  createPrdOutput,
  createUserStoryInput,
  createUserStoryOutput,
  deletePrdOutput,
  getPrdOutput,
  listAcceptanceCriteriaInput,
  listAcceptanceCriteriaOutput,
  listPrdsInput,
  listPrdsOutput,
  listUserStoriesInput,
  listUserStoriesOutput,
  prdIdInput,
  updatePrdInput,
  updatePrdOutput,
} from "./model";

const STORY_TAGS = ["PRD Stories & Criteria"];

const TAGS = ["PRDs"];
const getPath = generatePath("/prds");

const MANAGE_ROLES = ["owner", "admin"] as const;

export const prdRouter = router({
  createPrd: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/"), tags: TAGS } })
    .input(createPrdInput)
    .output(createPrdOutput)
    .mutation(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId);
      const { id } = await prdService.createPrd(input);

      if (!id) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create PRD." });
      }

      return { id };
    }),

  listPrds: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/list"), tags: TAGS } })
    .input(listPrdsInput)
    .output(listPrdsOutput)
    .query(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId);

      return prdService.listPrds(input);
    }),

  getPrdById: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/by-id"), tags: TAGS } })
    .input(prdIdInput)
    .output(getPrdOutput)
    .query(async ({ ctx, input }) => {
      const { prd } = await prdService.getPrdById(input);

      if (prd) {
        await assertOrgAccess(ctx.userId, prd.organizationId);
      }

      return { prd };
    }),

  updatePrd: authenticatedProcedure
    .meta({ openapi: { method: "PATCH", path: getPath("/"), tags: TAGS } })
    .input(updatePrdInput)
    .output(updatePrdOutput)
    .mutation(async ({ ctx, input }) => {
      const { prd } = await prdService.getPrdById({ id: input.id });

      if (!prd) {
        throw new TRPCError({ code: "NOT_FOUND", message: "PRD not found." });
      }

      await assertOrgAccess(ctx.userId, prd.organizationId);

      return prdService.updatePrd(input);
    }),

  deletePrd: authenticatedProcedure
    .meta({ openapi: { method: "DELETE", path: getPath("/"), tags: TAGS } })
    .input(prdIdInput)
    .output(deletePrdOutput)
    .mutation(async ({ ctx, input }) => {
      const { prd } = await prdService.getPrdById(input);

      if (!prd) {
        throw new TRPCError({ code: "NOT_FOUND", message: "PRD not found." });
      }

      await assertOrgAccess(ctx.userId, prd.organizationId, MANAGE_ROLES);
      await prdService.deletePrd(input);

      return { success: true };
    }),

  createUserStory: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/user-stories"), tags: STORY_TAGS } })
    .input(createUserStoryInput)
    .output(createUserStoryOutput)
    .mutation(async ({ ctx, input }) => {
      const { prd } = await prdService.getPrdById({ id: input.prdId });
      if (!prd) throw new TRPCError({ code: "NOT_FOUND", message: "PRD not found." });

      await assertOrgAccess(ctx.userId, prd.organizationId);
      const { id } = await prdService.createUserStory(input);

      if (!id) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user story." });
      }

      return { id };
    }),

  listUserStories: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/user-stories"), tags: STORY_TAGS } })
    .input(listUserStoriesInput)
    .output(listUserStoriesOutput)
    .query(async ({ ctx, input }) => {
      const { prd } = await prdService.getPrdById({ id: input.prdId });
      if (!prd) throw new TRPCError({ code: "NOT_FOUND", message: "PRD not found." });

      await assertOrgAccess(ctx.userId, prd.organizationId);

      return prdService.listUserStories(input);
    }),

  createAcceptanceCriteria: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/acceptance-criteria"), tags: STORY_TAGS } })
    .input(createAcceptanceCriteriaInput)
    .output(createAcceptanceCriteriaOutput)
    .mutation(async ({ ctx, input }) => {
      const { prd } = await prdService.getPrdById({ id: input.prdId });
      if (!prd) throw new TRPCError({ code: "NOT_FOUND", message: "PRD not found." });

      await assertOrgAccess(ctx.userId, prd.organizationId);
      const { id } = await prdService.createAcceptanceCriteria(input);

      if (!id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create acceptance criteria.",
        });
      }

      return { id };
    }),

  listAcceptanceCriteria: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/acceptance-criteria"), tags: STORY_TAGS } })
    .input(listAcceptanceCriteriaInput)
    .output(listAcceptanceCriteriaOutput)
    .query(async ({ ctx, input }) => {
      const { prd } = await prdService.getPrdById({ id: input.prdId });
      if (!prd) throw new TRPCError({ code: "NOT_FOUND", message: "PRD not found." });

      await assertOrgAccess(ctx.userId, prd.organizationId);

      return prdService.listAcceptanceCriteria(input);
    }),
});
