"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { skipToken } from "@tanstack/react-query";
import { ArrowLeft, Check, GripVertical, Loader2, Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { Textarea } from "~/components/ui/textarea";
import {
  useApprovePrd,
  useGetPrdById,
  useListAcceptanceCriteria,
  useListUserStories,
  useUpdatePrd,
} from "~/hooks/api/prd";

const ARRAY_SECTIONS = [
  { key: "goals", label: "Goals", placeholder: "An outcome that defines success" },
  { key: "nonGoals", label: "Non-goals", placeholder: "Something explicitly out of scope" },
  { key: "edgeCases", label: "Edge cases", placeholder: "A case an engineer might miss" },
  { key: "assumptions", label: "Assumptions", placeholder: "Something treated as true" },
  { key: "successMetrics", label: "Success metrics", placeholder: "A measurable signal" },
] as const;

type ArrayKey = (typeof ARRAY_SECTIONS)[number]["key"];

type Draft = {
  title: string;
  problemStatement: string;
  goals: string[];
  nonGoals: string[];
  edgeCases: string[];
  assumptions: string[];
  successMetrics: string[];
};

function cleanList(items: string[]) {
  return items.map((i) => i.trim()).filter(Boolean);
}

function BulletList({ items }: { items: string[] }) {
  if (!items.length) {
    return <p className="text-muted-foreground/70 text-sm italic">None specified.</p>;
  }
  return (
    <ul className="space-y-1.5 text-sm">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="bg-muted-foreground/40 mt-2 size-1.5 shrink-0 rounded-full" />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function EditableList({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="group flex items-center gap-1.5">
          <GripVertical className="text-muted-foreground/30 size-4 shrink-0" />
          <Input
            value={item}
            placeholder={placeholder}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove item"
            className="text-muted-foreground hover:text-destructive size-8 shrink-0"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="ml-5 self-start"
        onClick={() => onChange([...items, ""])}
      >
        <Plus className="size-4" />
        Add item
      </Button>
    </div>
  );
}

function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {title}
        </CardTitle>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function PrdSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}

function PrdDetail() {
  const params = useParams<{ id: string; prdId: string }>();
  const projectId = params.id;
  const id = params.prdId;
  const router = useRouter();
  const searchParams = useSearchParams();

  const { prd, isLoading, refetch } = useGetPrdById({ id });
  const { userStories } = useListUserStories(prd ? { prdId: id } : skipToken);
  const { acceptanceCriteria } = useListAcceptanceCriteria(prd ? { prdId: id } : skipToken);
  const { updatePrdAsync, isPending: isSaving } = useUpdatePrd();
  const { approvePrdAsync, isPending: isApproving } = useApprovePrd();

  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState<Draft | null>(null);

  // Open straight into edit mode when linked with ?edit=1.
  React.useEffect(() => {
    if (prd && searchParams.get("edit") === "1") setIsEditing(true);
  }, [prd, searchParams]);

  // Seed the draft from the loaded PRD the moment we enter edit mode.
  React.useEffect(() => {
    if (isEditing && prd && !draft) {
      setDraft({
        title: prd.title,
        problemStatement: prd.problemStatement ?? "",
        goals: [...prd.goals],
        nonGoals: [...prd.nonGoals],
        edgeCases: [...prd.edgeCases],
        assumptions: [...prd.assumptions],
        successMetrics: [...prd.successMetrics],
      });
    }
  }, [isEditing, prd, draft]);

  function setArray(key: ArrayKey, next: string[]) {
    setDraft((d) => (d ? { ...d, [key]: next } : d));
  }

  function exitEditing() {
    setIsEditing(false);
    setDraft(null);
    if (searchParams.get("edit")) router.replace(`/dashboard/projects/${projectId}/prds/${id}`);
  }

  async function handleSave() {
    if (!draft || !prd) return;
    if (!draft.title.trim()) {
      toast.error("Title can't be empty");
      return;
    }
    try {
      await updatePrdAsync({
        id,
        title: draft.title.trim(),
        problemStatement: draft.problemStatement.trim(),
        goals: cleanList(draft.goals),
        nonGoals: cleanList(draft.nonGoals),
        edgeCases: cleanList(draft.edgeCases),
        assumptions: cleanList(draft.assumptions),
        successMetrics: cleanList(draft.successMetrics),
      });
      toast.success("PRD updated");
      exitEditing();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save the PRD");
    }
  }

  async function handleApprove() {
    if (!prd) return;
    try {
      await approvePrdAsync({ id });
      toast.success("PRD approved — generating tasks");
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve the PRD");
    }
  }

  if (isLoading) return <PrdSkeleton />;
  if (!prd) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <p className="text-muted-foreground text-sm">PRD not found.</p>
      </div>
    );
  }

  const isApproved = Boolean(prd.approvedAt);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/dashboard/projects/${projectId}/feature-requests/${prd.featureRequestId}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to feature request
        </Link>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="ghost" size="sm" onClick={exitEditing} disabled={isSaving}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin" /> : <Check className="size-4" />}
                Save changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="size-4" />
                Edit
              </Button>
              {!isApproved ? (
                <Button size="sm" onClick={handleApprove} disabled={isApproving}>
                  {isApproving ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  Approve &amp; generate tasks
                </Button>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">v{prd.version}</Badge>
          {isApproved ? (
            <Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600">
              <Check className="size-3" />
              Approved
            </Badge>
          ) : (
            <Badge variant="secondary" className="capitalize">
              {prd.status.replace(/_/g, " ")}
            </Badge>
          )}
        </div>

        {isEditing && draft ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prd-title">Title</Label>
            <Input
              id="prd-title"
              value={draft.title}
              onChange={(e) => setDraft((d) => (d ? { ...d, title: e.target.value } : d))}
              className="text-lg font-semibold"
              maxLength={200}
            />
          </div>
        ) : (
          <h1 className="text-2xl font-semibold tracking-tight">{prd.title}</h1>
        )}

        <p className="text-muted-foreground text-xs">
          {prd.generatedByModel ? `Drafted by ${prd.generatedByModel} · ` : ""}
          Last updated {new Date(prd.updatedAt).toLocaleString()}
        </p>
      </div>

      <Separator />

      {/* Problem statement */}
      <SectionCard title="Problem statement">
        {isEditing && draft ? (
          <Textarea
            value={draft.problemStatement}
            onChange={(e) =>
              setDraft((d) => (d ? { ...d, problemStatement: e.target.value } : d))
            }
            placeholder="The underlying user or business problem — the WHY."
            rows={4}
          />
        ) : prd.problemStatement ? (
          <p className="text-sm leading-relaxed">{prd.problemStatement}</p>
        ) : (
          <p className="text-muted-foreground/70 text-sm italic">No problem statement.</p>
        )}
      </SectionCard>

      {/* Array sections */}
      {ARRAY_SECTIONS.map((section) => (
        <SectionCard key={section.key} title={section.label}>
          {isEditing && draft ? (
            <EditableList
              items={draft[section.key]}
              placeholder={section.placeholder}
              onChange={(next) => setArray(section.key, next)}
            />
          ) : (
            <BulletList items={prd[section.key]} />
          )}
        </SectionCard>
      ))}

      {/* User stories (read-only) */}
      <SectionCard title={`User stories${userStories.length ? ` · ${userStories.length}` : ""}`}>
        {userStories.length ? (
          <ul className="flex flex-col gap-3 text-sm">
            {userStories.map((story) => (
              <li key={story.id} className="border-border/60 border-l-2 pl-3">
                {story.asA || story.iWant || story.soThat ? (
                  <span className="leading-relaxed">
                    <span className="text-muted-foreground">As </span>
                    <span className="font-medium">{story.asA ?? "a user"}</span>
                    <span className="text-muted-foreground">, I want </span>
                    {story.iWant ?? "…"}
                    <span className="text-muted-foreground">, so that </span>
                    {story.soThat ?? "…"}.
                  </span>
                ) : (
                  <span className="leading-relaxed">{story.narrative}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground/70 text-sm italic">No user stories.</p>
        )}
      </SectionCard>

      {/* Acceptance criteria (read-only) */}
      <SectionCard
        title={`Acceptance criteria${
          acceptanceCriteria.length ? ` · ${acceptanceCriteria.length}` : ""
        }`}
      >
        {acceptanceCriteria.length ? (
          <ul className="space-y-2 text-sm">
            {acceptanceCriteria.map((criterion) => (
              <li key={criterion.id} className="flex gap-2.5">
                <Check className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <span className="leading-relaxed">{criterion.description}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground/70 text-sm italic">No acceptance criteria.</p>
        )}
      </SectionCard>

      {isApproved ? (
        <p className="text-muted-foreground border-t pt-4 text-sm">
          This PRD is approved — engineering tasks have been generated from it.
        </p>
      ) : null}
    </div>
  );
}

export default function PrdDetailPage() {
  return (
    <React.Suspense fallback={<PrdSkeleton />}>
      <PrdDetail />
    </React.Suspense>
  );
}
