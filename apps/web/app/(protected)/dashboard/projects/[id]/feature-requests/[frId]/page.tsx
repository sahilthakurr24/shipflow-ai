"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, Rocket, Send } from "lucide-react";
import { toast } from "sonner";

import { PrdSection } from "~/components/feature-request/prd-section";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Textarea } from "~/components/ui/textarea";
import { useAddClarificationMessage } from "~/hooks/api/feature-request";
import { trpc } from "~/trpc/client";

// Statuses where the requester is still chatting with the analyst.
const CLARIFYING_STATUSES = new Set(["intake", "clarifying"]);
// Status while the PRD is being written by the AI (no chat input yet).
const GENERATING_PRD_STATUS = "prd_drafting";

// Once a feature is past the PRD stage it can be reviewed & shipped.
const REVIEWABLE_STATUSES = new Set([
  "planning",
  "ready_for_development",
  "in_development",
  "in_review",
  "changes_requested",
  "pending_approval",
  "approved",
  "shipped",
]);

// Rotating status lines shown while the PRD is being generated, so the wait
// feels alive and the user knows roughly what's happening.
const PRD_GENERATION_PHASES = [
  "Generating PRD",
  "Analyzing the clarified requirements",
  "Drafting user stories",
  "Writing acceptance criteria",
  "Finalizing the document",
];

type ChatMessage = { id: string; role: "agent" | "user"; content: string };

export default function FeatureRequestDetailPage() {
  const params = useParams<{ id: string; frId: string }>();
  const projectId = params.id;
  const id = params.frId;

  // Poll the request itself while it's still being worked (clarifying → drafting)
  // so the status transitions (and the indicator label) update live.
  const featureRequestQuery = trpc.featureRequest.getFeatureRequestById.useQuery(
    { id },
    {
      refetchInterval: (q) => {
        const s = q.state.data?.featureRequest?.status;
        return s && (CLARIFYING_STATUSES.has(s) || s === GENERATING_PRD_STATUS) ? 4000 : false;
      },
    },
  );
  const featureRequest = featureRequestQuery.data?.featureRequest;
  const isLoading = featureRequestQuery.isLoading;
  const status = featureRequest?.status;
  const isClarifying = status ? CLARIFYING_STATUSES.has(status) : true;
  const isGeneratingPrd = status === GENERATING_PRD_STATUS;

  const messagesQuery = trpc.featureRequest.listClarificationMessages.useQuery(
    { featureRequestId: id },
    { refetchInterval: isClarifying ? 4000 : false },
  );
  const clarifications = [...(messagesQuery.data?.messages ?? [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  // The original request reads as the opening user message (ChatGPT-style).
  const chat: ChatMessage[] = [
    ...(featureRequest
      ? [{ id: "__request", role: "user" as const, content: featureRequest.description }]
      : []),
    ...clarifications.map((m) => ({ id: m.id, role: m.role, content: m.content })),
  ];
  const lastClarification = clarifications[clarifications.length - 1];
  // Show a generative indicator while the AI is working: "Thinking" when it owes
  // the next clarifying question, rotating PRD phases once clarification is done.
  const clarifyThinking =
    isClarifying &&
    !messagesQuery.isLoading &&
    (clarifications.length === 0 || lastClarification?.role === "user");
  const showIndicator = isGeneratingPrd || clarifyThinking;

  // Cycle the PRD-generation status line while drafting.
  const [prdPhase, setPrdPhase] = React.useState(0);
  React.useEffect(() => {
    if (!isGeneratingPrd) {
      setPrdPhase(0);
      return;
    }
    const interval = setInterval(() => {
      setPrdPhase((i) => (i + 1) % PRD_GENERATION_PHASES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isGeneratingPrd]);

  const primaryLabel = isGeneratingPrd ? PRD_GENERATION_PHASES[prdPhase] : "Thinking";

  const { addClarificationMessageAsync, isPending } = useAddClarificationMessage();
  const [reply, setReply] = React.useState("");
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.length, showIndicator]);

  async function submit() {
    const content = reply.trim();
    if (!content || isPending) return;
    try {
      await addClarificationMessageAsync({ featureRequestId: id, role: "user", content });
      setReply("");
      await messagesQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send your answer");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6">
      {/* Top bar: back + (once past PRD) the review & ship entry point */}
      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard/projects/${projectId}/feature-requests`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          Feature Requests
        </Link>
        {status && REVIEWABLE_STATUSES.has(status) ? (
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/projects/${projectId}/feature-requests/${id}/review`}>
              <Rocket className="size-4" />
              Review &amp; Ship
            </Link>
          </Button>
        ) : null}
      </div>

      {/* Chat */}
      {isLoading || messagesQuery.isLoading ? (
        <div className="flex flex-col gap-6">
          <Skeleton className="ml-auto h-10 w-2/3 rounded-3xl" />
          <Skeleton className="h-16 w-3/4 rounded-lg" />
        </div>
      ) : !featureRequest ? (
        <p className="text-muted-foreground text-sm">Feature request not found.</p>
      ) : (
        <div className="flex flex-1 flex-col gap-7">
          {chat.map((message) =>
            message.role === "user" ? (
              <div key={message.id} className="flex justify-end">
                <div className="bg-muted max-w-[80%] rounded-3xl px-4 py-2.5 text-sm whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
            ) : (
              <div key={message.id} className="flex gap-3">
                <span className="bg-foreground mt-2 size-2 shrink-0 rounded-full" />
                <div className="flex-1 text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
            ),
          )}

          {showIndicator ? (
            <div className="flex gap-3">
              <span className="bg-foreground mt-2 size-2 shrink-0 animate-pulse rounded-full" />
              <div className="flex flex-col gap-1 py-1.5">
                <div className="flex items-center gap-2">
                  <span
                    key={primaryLabel}
                    className="text-muted-foreground animate-pulse text-sm transition-opacity"
                  >
                    {primaryLabel}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="bg-muted-foreground/50 size-1.5 animate-bounce rounded-full [animation-delay:-0.3s]" />
                    <span className="bg-muted-foreground/50 size-1.5 animate-bounce rounded-full [animation-delay:-0.15s]" />
                    <span className="bg-muted-foreground/50 size-1.5 animate-bounce rounded-full" />
                  </span>
                </div>
                {isGeneratingPrd ? (
                  <span className="text-muted-foreground/70 text-xs">
                    This might take a little while — you can stay here or come back later.
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          {status === "rejected" || status === "duplicate" ? (
            <p className="text-muted-foreground border-t pt-4 text-sm">
              {status === "duplicate"
                ? "Marked as already covered by existing functionality."
                : "Rejected as out of scope."}
              {featureRequest.buildDecisionRationale
                ? ` ${featureRequest.buildDecisionRationale}`
                : ""}
            </p>
          ) : !isClarifying && !isGeneratingPrd ? (
            <p className="text-muted-foreground border-t pt-4 text-sm">
              Clarification complete — moved on to the PRD stage.
            </p>
          ) : null}

          <div ref={bottomRef} />
        </div>
      )}

      <PrdSection featureRequestId={id} projectId={projectId} status={status} />

      {/* Composer — pinned to the bottom of the viewport like ChatGPT */}
      {featureRequest && isClarifying ? (
        <div className="sticky bottom-0 z-10 mt-auto pt-4">
          {/* fade so messages scroll cleanly under the input */}
          <div className="from-background pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-t to-transparent" />
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
            className="border-input bg-background flex items-end gap-2 rounded-3xl border p-2 shadow-lg"
          >
            <Textarea
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              placeholder="Reply…"
              rows={1}
              className="max-h-40 min-h-9 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
              disabled={isPending}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void submit();
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              className="size-9 shrink-0 rounded-full"
              disabled={isPending || !reply.trim()}
            >
              {isPending ? <Loader2 className="animate-spin" /> : <Send className="size-4" />}
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
