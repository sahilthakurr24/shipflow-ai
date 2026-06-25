import z from "zod";

export const listInstallationRepositoriesInput = z.object({
  installationId: z.string().describe("GitHub App installation id"),
});

export type ListInstallationRepositoriesInputType = z.infer<
  typeof listInstallationRepositoriesInput
>;

export const getInstallUrlInput = z.object({
  organizationId: z.uuid().describe("org the install will be linked to"),
});

export type GetInstallUrlInputType = z.infer<typeof getInstallUrlInput>;
