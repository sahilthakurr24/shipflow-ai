import z from "zod";

export const userSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string(),
  emailVerified: z.boolean().nullable(),
  profileImageUrl: z.string().nullable(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});

export const getUserByIdInput = z.object({
  id: z.string().describe("Id of the user"),
});

export const getUserByIdOutput = z.object({
  user: userSchema.optional(),
});

export const getUserByEmailInput = z.object({
  email: z.email().describe("Email of the user"),
});

export const updateUserInput = z.object({
  fullName: z
    .string()
    .min(1, "Name cannot be empty")
    .max(80, "Maximum 80 chars are allowed")
    .describe("Full name of the user")
    .optional(),
  profileImageUrl: z.url().describe("Profile image url of the user").optional(),
});

export const updateUserOutput = z.object({
  id: z.string().optional(),
});

export const deleteUserOutput = z.object({
  success: z.boolean(),
});
