import { z, zodUndefinedModel } from "../../schema";
import { userService } from "../../services";
import { getAuthenticationMethodOutputSchema } from "@repo/services/user/model";
import { authenticatedProcedure, publicProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import {
  deleteUserOutput,
  getUserByEmailInput,
  getUserByIdInput,
  getUserByIdOutput,
  updateUserInput,
  updateUserOutput,
} from "./model";

const TAGS = ["Authentication"];
const getPath = generatePath("/authentication");

export const authRouter = router({
  getSupportedAuthenticationProviders: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/supported-providers"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(z.readonly(z.array(getAuthenticationMethodOutputSchema)))
    .query(async () => {
      const supportedMethods = await userService.getAuthenticationMethods();
      return supportedMethods;
    }),

  getUserById: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/getuser-by-id"), tags: TAGS } })
    .input(getUserByIdInput)
    .output(getUserByIdOutput)
    .query(async ({ ctx }) => {
      return userService.getUserById({ id: ctx.userId });
    }),

  getUserByEmail: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/getuser-by-email"), tags: TAGS } })
    .input(getUserByEmailInput)
    .output(getUserByIdOutput)
    .query(async ({ input }) => {
      return userService.getUserByEmail({ email: input.email });
    }),

  updateUser: authenticatedProcedure
    .meta({ openapi: { method: "PATCH", path: getPath("/update-user"), tags: TAGS } })
    .input(updateUserInput)
    .output(updateUserOutput)
    .mutation(async ({ ctx, input }) => {
      const { id } = await userService.updateUser({
        id: ctx.userId,
        fullName: input.fullName,
        profileImageUrl: input.profileImageUrl,
      });

      return { id };
    }),

  deleteUser: authenticatedProcedure
    .meta({ openapi: { method: "DELETE", path: getPath("/delete-user"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(deleteUserOutput)
    .mutation(async ({ ctx }) => {
      await userService.deleteUser({ id: ctx.userId });

      return { success: true };
    }),
});
