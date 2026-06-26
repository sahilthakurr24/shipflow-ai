import { inngest } from "../client";
import { githubService, pullRequestService } from "../services";

type GithubPullRequestEventData = {
  installationId: string;
  organizationId: string;
  repositoryId: string;
  owner: string;
  repo: string;
  pullNumber: number;
  action?: string;
};

/**
 * Snapshots a pull request from GitHub into our DB, then asks for an AI review.
 * Triggered by `github/pull_request` (fanned out from the webhook recorder) so
 * fetching/persisting the diff retries independently of recording the delivery.
 */
export const githubPullRequestFunction = inngest.createFunction(
  { id: "github-pull-request", triggers: [{ event: "github/pull_request" }] },
  async ({ event, step }) => {
    const { installationId, organizationId, repositoryId, owner, repo, pullNumber } =
      event.data as GithubPullRequestEventData;

    const ref = { installationId, owner, repo, pullNumber };

    const { pullRequest } = await step.run("fetch-pull-request", () =>
      githubService.getPullRequest(ref),
    );

    const { files } = await step.run("fetch-pull-request-files", () =>
      githubService.listPullRequestFiles(ref),
    );

    const { id: pullRequestId } = await step.run("snapshot-pull-request", () =>
      pullRequestService.snapshotPullRequest({
        organizationId,
        repositoryId,
        ...pullRequest,
        files,
      }),
    );

    await step.sendEvent("request-review", {
      name: "pull-request/review.requested",
      data: { pullRequestId, organizationId },
    });

    return { pullRequestId };
  },
);
