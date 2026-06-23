import { relations } from "drizzle-orm";

import { approvalsTable } from "./approval";
import { accountsTable, sessionsTable } from "./auth";
import { paymentsTable, subscriptionsTable, usageRecordsTable } from "./billing";
import { clarificationMessagesTable, featureRequestsTable } from "./feature-request";
import { membershipsTable, organizationsTable } from "./organization";
import { acceptanceCriteriaTable, prdsTable, userStoriesTable } from "./prd";
import { projectsTable } from "./project";
import { pullRequestFilesTable, pullRequestsTable } from "./pull-request";
import { releasesTable } from "./release";
import { repositoriesTable } from "./repository";
import { reviewIssuesTable, reviewsTable } from "./review";
import { tasksTable } from "./task";
import { usersTable } from "./user";
import { webhookEventsTable } from "./webhook";
import { workflowRunsTable } from "./workflow";

/**
 * Drizzle relations powering the relational query API (`db.query.*`). These are
 * metadata only — the foreign keys live on the table definitions themselves.
 */

export const usersRelations = relations(usersTable, ({ many }) => ({
  memberships: many(membershipsTable),
  sessions: many(sessionsTable),
  accounts: many(accountsTable),
}));

export const sessionsRelations = relations(sessionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [sessionsTable.userId],
    references: [usersTable.id],
  }),
}));

export const accountsRelations = relations(accountsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [accountsTable.userId],
    references: [usersTable.id],
  }),
}));

export const organizationsRelations = relations(organizationsTable, ({ many, one }) => ({
  memberships: many(membershipsTable),
  projects: many(projectsTable),
  repositories: many(repositoriesTable),
  featureRequests: many(featureRequestsTable),
  prds: many(prdsTable),
  tasks: many(tasksTable),
  pullRequests: many(pullRequestsTable),
  reviews: many(reviewsTable),
  approvals: many(approvalsTable),
  releases: many(releasesTable),
  payments: many(paymentsTable),
  usageRecords: many(usageRecordsTable),
  workflowRuns: many(workflowRunsTable),
  subscription: one(subscriptionsTable),
}));

export const membershipsRelations = relations(membershipsTable, ({ one }) => ({
  organization: one(organizationsTable, {
    fields: [membershipsTable.organizationId],
    references: [organizationsTable.id],
  }),
  user: one(usersTable, {
    fields: [membershipsTable.userId],
    references: [usersTable.id],
  }),
}));

export const projectsRelations = relations(projectsTable, ({ one, many }) => ({
  organization: one(organizationsTable, {
    fields: [projectsTable.organizationId],
    references: [organizationsTable.id],
  }),
  repositories: many(repositoriesTable),
  featureRequests: many(featureRequestsTable),
}));

export const repositoriesRelations = relations(repositoriesTable, ({ one, many }) => ({
  organization: one(organizationsTable, {
    fields: [repositoriesTable.organizationId],
    references: [organizationsTable.id],
  }),
  project: one(projectsTable, {
    fields: [repositoriesTable.projectId],
    references: [projectsTable.id],
  }),
  pullRequests: many(pullRequestsTable),
}));

export const featureRequestsRelations = relations(featureRequestsTable, ({ one, many }) => ({
  organization: one(organizationsTable, {
    fields: [featureRequestsTable.organizationId],
    references: [organizationsTable.id],
  }),
  project: one(projectsTable, {
    fields: [featureRequestsTable.projectId],
    references: [projectsTable.id],
  }),
  creator: one(usersTable, {
    fields: [featureRequestsTable.createdByUserId],
    references: [usersTable.id],
    relationName: "feature_request_creator",
  }),
  assignee: one(usersTable, {
    fields: [featureRequestsTable.assignedToUserId],
    references: [usersTable.id],
    relationName: "feature_request_assignee",
  }),
  clarificationMessages: many(clarificationMessagesTable),
  prds: many(prdsTable),
  tasks: many(tasksTable),
  pullRequests: many(pullRequestsTable),
  reviews: many(reviewsTable),
  approvals: many(approvalsTable),
  releases: many(releasesTable),
}));

export const clarificationMessagesRelations = relations(clarificationMessagesTable, ({ one }) => ({
  featureRequest: one(featureRequestsTable, {
    fields: [clarificationMessagesTable.featureRequestId],
    references: [featureRequestsTable.id],
  }),
}));

export const prdsRelations = relations(prdsTable, ({ one, many }) => ({
  organization: one(organizationsTable, {
    fields: [prdsTable.organizationId],
    references: [organizationsTable.id],
  }),
  featureRequest: one(featureRequestsTable, {
    fields: [prdsTable.featureRequestId],
    references: [featureRequestsTable.id],
  }),
  userStories: many(userStoriesTable),
  acceptanceCriteria: many(acceptanceCriteriaTable),
  tasks: many(tasksTable),
}));

export const userStoriesRelations = relations(userStoriesTable, ({ one, many }) => ({
  prd: one(prdsTable, {
    fields: [userStoriesTable.prdId],
    references: [prdsTable.id],
  }),
  acceptanceCriteria: many(acceptanceCriteriaTable),
}));

export const acceptanceCriteriaRelations = relations(acceptanceCriteriaTable, ({ one, many }) => ({
  prd: one(prdsTable, {
    fields: [acceptanceCriteriaTable.prdId],
    references: [prdsTable.id],
  }),
  userStory: one(userStoriesTable, {
    fields: [acceptanceCriteriaTable.userStoryId],
    references: [userStoriesTable.id],
  }),
  reviewIssues: many(reviewIssuesTable),
}));

export const tasksRelations = relations(tasksTable, ({ one, many }) => ({
  organization: one(organizationsTable, {
    fields: [tasksTable.organizationId],
    references: [organizationsTable.id],
  }),
  featureRequest: one(featureRequestsTable, {
    fields: [tasksTable.featureRequestId],
    references: [featureRequestsTable.id],
  }),
  prd: one(prdsTable, {
    fields: [tasksTable.prdId],
    references: [prdsTable.id],
  }),
  project: one(projectsTable, {
    fields: [tasksTable.projectId],
    references: [projectsTable.id],
  }),
  reviewIssues: many(reviewIssuesTable),
}));

export const pullRequestsRelations = relations(pullRequestsTable, ({ one, many }) => ({
  organization: one(organizationsTable, {
    fields: [pullRequestsTable.organizationId],
    references: [organizationsTable.id],
  }),
  repository: one(repositoriesTable, {
    fields: [pullRequestsTable.repositoryId],
    references: [repositoriesTable.id],
  }),
  featureRequest: one(featureRequestsTable, {
    fields: [pullRequestsTable.featureRequestId],
    references: [featureRequestsTable.id],
  }),
  files: many(pullRequestFilesTable),
  reviews: many(reviewsTable),
}));

export const pullRequestFilesRelations = relations(pullRequestFilesTable, ({ one }) => ({
  pullRequest: one(pullRequestsTable, {
    fields: [pullRequestFilesTable.pullRequestId],
    references: [pullRequestsTable.id],
  }),
}));

export const reviewsRelations = relations(reviewsTable, ({ one, many }) => ({
  organization: one(organizationsTable, {
    fields: [reviewsTable.organizationId],
    references: [organizationsTable.id],
  }),
  pullRequest: one(pullRequestsTable, {
    fields: [reviewsTable.pullRequestId],
    references: [pullRequestsTable.id],
  }),
  featureRequest: one(featureRequestsTable, {
    fields: [reviewsTable.featureRequestId],
    references: [featureRequestsTable.id],
  }),
  prd: one(prdsTable, {
    fields: [reviewsTable.prdId],
    references: [prdsTable.id],
  }),
  issues: many(reviewIssuesTable),
  approvals: many(approvalsTable),
}));

export const reviewIssuesRelations = relations(reviewIssuesTable, ({ one }) => ({
  review: one(reviewsTable, {
    fields: [reviewIssuesTable.reviewId],
    references: [reviewsTable.id],
  }),
  acceptanceCriteria: one(acceptanceCriteriaTable, {
    fields: [reviewIssuesTable.acceptanceCriteriaId],
    references: [acceptanceCriteriaTable.id],
  }),
  task: one(tasksTable, {
    fields: [reviewIssuesTable.taskId],
    references: [tasksTable.id],
  }),
}));

export const approvalsRelations = relations(approvalsTable, ({ one }) => ({
  organization: one(organizationsTable, {
    fields: [approvalsTable.organizationId],
    references: [organizationsTable.id],
  }),
  featureRequest: one(featureRequestsTable, {
    fields: [approvalsTable.featureRequestId],
    references: [featureRequestsTable.id],
  }),
  review: one(reviewsTable, {
    fields: [approvalsTable.reviewId],
    references: [reviewsTable.id],
  }),
  reviewer: one(usersTable, {
    fields: [approvalsTable.reviewerUserId],
    references: [usersTable.id],
  }),
}));

export const releasesRelations = relations(releasesTable, ({ one }) => ({
  organization: one(organizationsTable, {
    fields: [releasesTable.organizationId],
    references: [organizationsTable.id],
  }),
  featureRequest: one(featureRequestsTable, {
    fields: [releasesTable.featureRequestId],
    references: [featureRequestsTable.id],
  }),
  pullRequest: one(pullRequestsTable, {
    fields: [releasesTable.pullRequestId],
    references: [pullRequestsTable.id],
  }),
  approval: one(approvalsTable, {
    fields: [releasesTable.approvalId],
    references: [approvalsTable.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptionsTable, ({ one, many }) => ({
  organization: one(organizationsTable, {
    fields: [subscriptionsTable.organizationId],
    references: [organizationsTable.id],
  }),
  payments: many(paymentsTable),
}));

export const paymentsRelations = relations(paymentsTable, ({ one }) => ({
  organization: one(organizationsTable, {
    fields: [paymentsTable.organizationId],
    references: [organizationsTable.id],
  }),
  subscription: one(subscriptionsTable, {
    fields: [paymentsTable.subscriptionId],
    references: [subscriptionsTable.id],
  }),
}));

export const usageRecordsRelations = relations(usageRecordsTable, ({ one }) => ({
  organization: one(organizationsTable, {
    fields: [usageRecordsTable.organizationId],
    references: [organizationsTable.id],
  }),
  featureRequest: one(featureRequestsTable, {
    fields: [usageRecordsTable.featureRequestId],
    references: [featureRequestsTable.id],
  }),
  review: one(reviewsTable, {
    fields: [usageRecordsTable.reviewId],
    references: [reviewsTable.id],
  }),
}));

export const webhookEventsRelations = relations(webhookEventsTable, ({ one }) => ({
  organization: one(organizationsTable, {
    fields: [webhookEventsTable.organizationId],
    references: [organizationsTable.id],
  }),
  repository: one(repositoriesTable, {
    fields: [webhookEventsTable.repositoryId],
    references: [repositoriesTable.id],
  }),
}));

export const workflowRunsRelations = relations(workflowRunsTable, ({ one }) => ({
  organization: one(organizationsTable, {
    fields: [workflowRunsTable.organizationId],
    references: [organizationsTable.id],
  }),
  featureRequest: one(featureRequestsTable, {
    fields: [workflowRunsTable.featureRequestId],
    references: [featureRequestsTable.id],
  }),
}));
