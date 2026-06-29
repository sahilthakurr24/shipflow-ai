import { featureRequestService, githubService, repositoryService } from "../services";

/**
 * Build the AI's code context for a feature request: resolve the FR's target
 * repository, then fetch a compact summary of that repo (file tree + README +
 * package.json) live from GitHub. Returns "" when the FR has no repo linked or
 * the repo can't be read, so callers can simply append it to a prompt.
 */
export async function getFeatureRequestRepoContext(featureRequestId: string): Promise<string> {
  const { featureRequest } = await featureRequestService.getFeatureRequestById({
    id: featureRequestId,
  });
  const repositoryId = featureRequest?.repositoryId;
  if (!repositoryId) return "";

  const { repository } = await repositoryService.getRepositoryById({ id: repositoryId });
  if (!repository?.githubInstallationId) return "";

  try {
    const { context } = await githubService.getRepoContext({
      installationId: repository.githubInstallationId,
      owner: repository.owner,
      repo: repository.name,
      defaultBranch: repository.defaultBranch,
    });
    return context;
  } catch {
    return "";
  }
}

/** Append a repository-context section to a prompt (no-op when context is empty). */
export function withRepoContext(prompt: string, repoContext: string): string {
  if (!repoContext) return prompt;
  return `${prompt}

Target repository (ground your output in this real codebase — its structure, framework, and conventions):
${repoContext}`;
}
