import { createHash } from "node:crypto";
import type { GetStepTools, Inngest } from "inngest";

/**
 * Tool handlers can be invoked multiple times within a single durable Inngest
 * run (e.g. once per task/story/issue), so each call needs a step ID that's
 * unique to its input rather than a static string, otherwise Inngest treats
 * later calls as memoized repeats of the first and skips them.
 */
export function runStep<T>(
  step: GetStepTools<Inngest.Any> | undefined,
  idPrefix: string,
  input: unknown,
  fn: () => Promise<T>,
): Promise<T> {
  if (!step) return fn();

  const hash = createHash("sha1").update(JSON.stringify(input)).digest("hex").slice(0, 10);
  return step.run(`${idPrefix}-${hash}`, fn) as Promise<T>;
}
