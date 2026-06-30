import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { organizationRouter } from "./routes/organization/route";
import { membershipRouter } from "./routes/membership/route";
import { invitationRouter } from "./routes/invitation/route";
import { featureRequestRouter } from "./routes/feature-request/route";
import { projectRouter } from "./routes/project/route";
import { repositoryRouter } from "./routes/repository/route";
import { prdRouter } from "./routes/prd/route";
import { taskRouter } from "./routes/task/route";
import { pullRequestRouter } from "./routes/pull-request/route";
import { reviewRouter } from "./routes/review/route";
import { approvalRouter } from "./routes/approval/route";
import { releaseRouter } from "./routes/release/route";
import { billingRouter } from "./routes/billing/route";
import { webhookRouter } from "./routes/webhook/route";
import { workflowRouter } from "./routes/workflow/route";

export const serverRouter = router({
  health: healthRouter,
  auth: authRouter,
  organization: organizationRouter,
  membership: membershipRouter,
  invitation: invitationRouter,
  featureRequest: featureRequestRouter,
  project: projectRouter,
  repository: repositoryRouter,
  prd: prdRouter,
  task: taskRouter,
  pullRequest: pullRequestRouter,
  review: reviewRouter,
  approval: approvalRouter,
  release: releaseRouter,
  billing: billingRouter,
  webhook: webhookRouter,
  workflow: workflowRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
