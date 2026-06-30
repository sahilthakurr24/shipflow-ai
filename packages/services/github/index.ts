import { getGithubApp, getGithubInstallUrl } from "../clients/github";
import {
  getInstallUrlInput,
  GetInstallUrlInputType,
  listInstallationRepositoriesInput,
  ListInstallationRepositoriesInputType,
  pullRequestRefInput,
  PullRequestRefInputType,
  repoContextInput,
  RepoContextInputType,
  repoRefInput,
  RepoRefInputType,
} from "./model";

// Paths under these are noise for understanding a codebase — skip them.
const IGNORED_TREE_SEGMENTS = [
  "node_modules/",
  ".git/",
  "dist/",
  "build/",
  ".next/",
  ".turbo/",
  "coverage/",
  "vendor/",
  ".cache/",
];
const MAX_TREE_PATHS = 300;
const MAX_README_CHARS = 2000;

function decodeBase64(content: string) {
  return Buffer.from(content, "base64").toString("utf8");
}

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

    // The PR payload only carries the head SHA, not the commit message. Fetch it
    // separately so we can show "what was tested" in the UI. Never let a failure
    // here block the snapshot — fall back to no message.
    let headCommitMessage: string | undefined;
    try {
      const { data: commit } = await octokit.rest.repos.getCommit({
        owner,
        repo,
        ref: pr.head.sha,
      });
      headCommitMessage = commit.commit.message;
    } catch {
      headCommitMessage = undefined;
    }

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
      headCommitMessage,
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

  /** Live list of a repo's branches. */
  public async listBranches(payload: RepoRefInputType) {
    const { installationId, owner, repo } = await repoRefInput.parseAsync(payload);
    const octokit = await this.getInstallationOctokit(installationId);

    const data = await octokit.paginate(octokit.rest.repos.listBranches, {
      owner,
      repo,
      per_page: 100,
    });

    const branches = data.map((branch) => ({
      name: branch.name,
      isProtected: branch.protected,
      commitSha: branch.commit.sha,
    }));

    return { branches };
  }

  /** Live list of a repo's most recent commits (first element = latest). */
  public async listCommits(payload: RepoRefInputType) {
    const { installationId, owner, repo } = await repoRefInput.parseAsync(payload);
    const octokit = await this.getInstallationOctokit(installationId);

    const { data } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      per_page: 20,
    });

    const commits = data.map((entry) => ({
      sha: entry.sha,
      message: entry.commit.message,
      authorName: entry.commit.author?.name ?? entry.author?.login ?? "unknown",
      authorLogin: entry.author?.login,
      authorAvatar: entry.author?.avatar_url,
      date: entry.commit.author?.date,
      htmlUrl: entry.html_url,
    }));

    return { commits };
  }

  /** Live list of a repo's open pull requests. */
  public async listOpenPullRequests(payload: RepoRefInputType) {
    const { installationId, owner, repo } = await repoRefInput.parseAsync(payload);
    const octokit = await this.getInstallationOctokit(installationId);

    const { data } = await octokit.rest.pulls.list({
      owner,
      repo,
      state: "open",
      per_page: 30,
    });

    const pullRequests = data.map((pr) => ({
      number: pr.number,
      title: pr.title,
      authorLogin: pr.user?.login,
      headBranch: pr.head.ref,
      baseBranch: pr.base.ref,
      htmlUrl: pr.html_url,
      createdAt: pr.created_at,
      isDraft: pr.draft ?? false,
    }));

    return { pullRequests };
  }

  /**
   * Build a compact, token-budgeted summary of a repository — its file tree
   * (filtered), README excerpt, and package.json highlights — for grounding the
   * AI agents that write the PRD and tasks against the real codebase.
   */
  public async getRepoContext(payload: RepoContextInputType) {
    const { installationId, owner, repo, defaultBranch } =
      await repoContextInput.parseAsync(payload);
    const octokit = await this.getInstallationOctokit(installationId);

    // 1. File tree of the default branch.
    let filePaths: string[] = [];
    let truncated = false;
    try {
      const { data: tree } = await octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: defaultBranch,
        recursive: "true",
      });
      truncated = tree.truncated ?? false;
      filePaths = tree.tree
        .filter((entry) => entry.type === "blob" && typeof entry.path === "string")
        .map((entry) => entry.path as string)
        .filter((path) => !IGNORED_TREE_SEGMENTS.some((seg) => path.includes(seg)))
        .slice(0, MAX_TREE_PATHS);
    } catch {
      filePaths = [];
    }

    // 2. README (optional).
    let readme = "";
    try {
      const { data } = await octokit.rest.repos.getReadme({ owner, repo });
      readme = decodeBase64(data.content).slice(0, MAX_README_CHARS);
    } catch {
      readme = "";
    }

    // 3. package.json highlights (optional).
    let packageSummary = "";
    try {
      const { data } = await octokit.rest.repos.getContent({ owner, repo, path: "package.json" });
      if (!Array.isArray(data) && "content" in data && data.content) {
        const pkg = JSON.parse(decodeBase64(data.content)) as {
          name?: string;
          dependencies?: Record<string, string>;
          devDependencies?: Record<string, string>;
        };
        const deps = Object.keys(pkg.dependencies ?? {});
        const devDeps = Object.keys(pkg.devDependencies ?? {});
        packageSummary = [
          pkg.name ? `name: ${pkg.name}` : "",
          deps.length ? `dependencies: ${deps.join(", ")}` : "",
          devDeps.length ? `devDependencies: ${devDeps.join(", ")}` : "",
        ]
          .filter(Boolean)
          .join("\n");
      }
    } catch {
      packageSummary = "";
    }

    const sections = [
      `Repository: ${owner}/${repo} (default branch: ${defaultBranch})`,
      filePaths.length
        ? `File tree${truncated ? " (truncated)" : ""}:\n${filePaths.join("\n")}`
        : "File tree: (unavailable)",
      packageSummary ? `package.json:\n${packageSummary}` : "",
      readme ? `README (excerpt):\n${readme}` : "",
    ].filter(Boolean);

    return { context: sections.join("\n\n") };
  }
}

export default GithubService;
