import { z } from "zod";

export const getAuthenticationMethodOutputSchema = z.object({
  provider: z.enum(["GOOGLE_OAUTH"]),
  displayName: z.string().optional(),
  displayText: z.string().optional(),
  authUrl: z.string(),
});
export type GetAuthenticationMethodOutputSchema = z.infer<
  typeof getAuthenticationMethodOutputSchema
>;

export const userIdInput = z.object({
  id: z.uuid().describe("id of the user"),
});

export type UserIdInputType = z.infer<typeof userIdInput>;

export const userEmailInput = z.object({
  email: z.email().describe("email of the user"),
});

export type UserEmailInputType = z.infer<typeof userEmailInput>;

export const updateUserInput = z.object({
  id: z.uuid().describe("id of the user"),
  fullName: z
    .string()
    .describe("full name of the user")
    .min(1, "Name cannot be empty")
    .max(80, "Maximum 80 chars are allowed")
    .optional(),
  profileImageUrl: z.url().describe("profile image url of the user").optional(),
});

export type UpdateUserInputType = z.infer<typeof updateUserInput>;

