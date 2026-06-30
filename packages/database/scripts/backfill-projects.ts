import "dotenv/config";
import { and, eq, isNull } from "drizzle-orm";

import db from "../index";
import {
  featureRequestsTable,
  organizationsTable,
  projectsTable,
  repositoriesTable,
  tasksTable,
} from "../schema";

/**
 * One-off backfill: give every org a "Default" project, connect its first repo,
 * and assign existing (project-less) feature requests + tasks to it — so the new
 * project-scoped views show your existing work instead of hiding it.
 *
 * Idempotent: re-running won't create duplicate default projects or re-link
 * already-assigned rows. Run once with:
 *   pnpm --filter=@repo/database exec tsx scripts/backfill-projects.ts
 */
async function main() {
  const orgs = await db.select().from(organizationsTable);

  for (const org of orgs) {
    const repos = await db
      .select()
      .from(repositoriesTable)
      .where(eq(repositoriesTable.organizationId, org.id));
    if (repos.length === 0) {
      console.log(`• ${org.name}: no repositories — skipped`);
      continue;
    }

    // Reuse an existing "Default" project for this org, else create one.
    let [project] = await db
      .select()
      .from(projectsTable)
      .where(and(eq(projectsTable.organizationId, org.id), eq(projectsTable.key, "DEFAULT")));
    if (!project) {
      [project] = await db
        .insert(projectsTable)
        .values({ organizationId: org.id, name: "Default Project", key: "DEFAULT" })
        .returning();
    }
    if (!project) throw new Error(`Failed to ensure default project for ${org.name}`);

    // Connect the first unconnected repo (one repo per project).
    const repo = repos.find((r) => !r.projectId) ?? repos[0]!;
    if (!repo.projectId) {
      await db
        .update(repositoriesTable)
        .set({ projectId: project.id })
        .where(eq(repositoriesTable.id, repo.id));
    }

    // Assign project-less feature requests + tasks to the default project.
    await db
      .update(featureRequestsTable)
      .set({ projectId: project.id })
      .where(
        and(
          eq(featureRequestsTable.organizationId, org.id),
          isNull(featureRequestsTable.projectId),
        ),
      );
    await db
      .update(tasksTable)
      .set({ projectId: project.id })
      .where(and(eq(tasksTable.organizationId, org.id), isNull(tasksTable.projectId)));

    console.log(`✓ ${org.name}: backfilled into "${project.name}" (repo ${repo.fullName})`);
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
