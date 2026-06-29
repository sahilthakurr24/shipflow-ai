import { GithubCallback } from "./github-callback";

// GitHub redirects here (the App's "Setup URL") after an install with
// ?installation_id=…&state=<organizationId>&setup_action=install
export default async function GithubCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ installation_id?: string; state?: string; setup_action?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <GithubCallback installationId={params.installation_id} state={params.state} />
    </div>
  );
}
