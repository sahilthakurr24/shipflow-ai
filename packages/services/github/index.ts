import { getGithubApp, getGithubInstallUrl } from "../clients/github";
import {
  getInstallUrlInput,
  GetInstallUrlInputType,
  listInstallationRepositoriesInput,
  ListInstallationRepositoriesInputType,
  pullRequestRefInput,
  PullRequestRefInputType,
} from "./model";

type PullRequestFileStatus = "added" | "modified" | "removed" | "renamed" | "copied" | "changed";

const FILE_STATUSES: PullRequestFileStatus[] = [
  "added",
  "modified",
  "removed",
  "renamed",
  "copied",
  "changed",
];

/** GitHub also returns "unchanged"; map anything outside our enum to "modified". */
function mapFileStatus(status: string): PullRequestFileStatus {
  return (FILE_STATUSES as string[]).includes(status)
    ? (status as PullRequestFileStatus)
    : "modified";
}

function mapPullRequestState(pr: {
  merged?: boolean;
  state: string;
  draft?: boolean;
}): "open" | "closed" | "merged" | "draft" {
  if (pr.merged) return "merged";
  if (pr.state === "closed") return "closed";
  if (pr.draft) return "draft";
  return "open";
}

class GithubService {
  /** An Octokit scoped to one installation (token minted + cached by the App). */
  private async getInstallationOctokit(installationId: string) {
    const app = await getGithubApp();
    return app.getInstallationOctokit(Number(installationId));
  }

  public async getInstallUrl(payload: GetInstallUrlInputType) {
    const { organizationId } = await getInstallUrlInput.parseAsync(payload);

    // organizationId is round-tripped through GitHub as `state` so the setup
    // callback knows which org the install belongs to
    return { url: getGithubInstallUrl(organizationId) };
  }

  public async listInstallationRepositories(payload: ListInstallationRepositoriesInputType) {
    const { installationId } = await listInstallationRepositoriesInput.parseAsync(payload);
    const octokit = await this.getInstallationOctokit(installationId);

    // paginate unwraps the { total_count, repositories } envelope into a flat array
    const repos = await octokit.paginate(octokit.rest.apps.listReposAccessibleToInstallation);

    // shaped to line up with createRepositoryInput for the upsert step next
    const repositories = repos.map((repo) => ({
      githubRepoId: String(repo.id),
      owner: repo.owner.login,
      name: repo.name,
      fullName: repo.full_name,
      defaultBranch: repo.default_branch,
      isPrivate: repo.private,
      htmlUrl: repo.html_url,
    }));

    return { repositories };
  }

  /** Fetch a PR's current state from GitHub, shaped for snapshotPullRequest. */
  public async getPullRequest(payload: PullRequestRefInputType) {
    const { installationId, owner, repo, pullNumber } =
      await pullRequestRefInput.parseAsync(payload);
    const octokit = await this.getInstallationOctokit(installationId);

    const { data: pr } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
    });

    const pullRequest = {
      githubPrNumber: pr.number,
      githubPrId: String(pr.id),
      title: pr.title,
      body: pr.body ?? undefined,
      state: mapPullRequestState(pr),
      isDraft: pr.draft ?? false,
      authorLogin: pr.user?.login,
      headBranch: pr.head.ref,
      baseBranch: pr.base.ref,
      headSha: pr.head.sha,
      htmlUrl: pr.html_url,
      additions: pr.additions,
      deletions: pr.deletions,
      changedFilesCount: pr.changed_files,
    };

    return { pullRequest };
  }

  /** Fetch a PR's changed files + patches, shaped for snapshotPullRequest. */
  public async listPullRequestFiles(payload: PullRequestRefInputType) {
    const { installationId, owner, repo, pullNumber } =
      await pullRequestRefInput.parseAsync(payload);
    const octokit = await this.getInstallationOctokit(installationId);

    const data = await octokit.paginate(octokit.rest.pulls.listFiles, {
      owner,
      repo,
      pull_number: pullNumber,
      per_page: 100,
    });

    const files = data.map((file) => ({
      filename: file.filename,
      previousFilename: file.previous_filename,
      status: mapFileStatus(file.status),
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
      patch: file.patch,
    }));

    return { files };
  }
}

export default GithubService;
