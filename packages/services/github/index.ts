import { getGithubApp, getGithubInstallUrl } from "../clients/github";
import {
  getInstallUrlInput,
  GetInstallUrlInputType,
  listInstallationRepositoriesInput,
  ListInstallationRepositoriesInputType,
} from "./model";

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
}

export default GithubService;
