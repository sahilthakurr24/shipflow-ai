import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Code2,
  FileText,
  GitPullRequest,
  ListChecks,
  Rocket,
  ScanSearch,
} from "lucide-react";

import { Button } from "~/components/ui/button";

const PIPELINE = [
  { label: "Feature request", icon: GitPullRequest },
  { label: "PRD", icon: FileText },
  { label: "Tasks", icon: ListChecks },
  { label: "Code", icon: Code2 },
  { label: "AI review", icon: ScanSearch },
  { label: "Ship", icon: CheckCircle2 },
] as const;

export default function Home() {
  return (
    <main className="bg-background relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 py-16">
      {/* Ambient background */}
      <div
        aria-hidden
        className="bg-primary/10 pointer-events-none absolute top-0 left-1/2 -z-10 size-[600px] max-w-full -translate-x-1/2 -translate-y-1/3 rounded-full blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at center, black, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black, transparent 75%)",
        }}
      />

      <div className="flex w-full max-w-2xl flex-col items-center text-center">
        {/* Coming soon badge */}
        <span className="border-border bg-card text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium shadow-sm">
          <span className="relative flex size-2">
            <span className="bg-primary/60 absolute inline-flex size-full animate-ping rounded-full opacity-75" />
            <span className="bg-primary relative inline-flex size-2 rounded-full" />
          </span>
          Coming soon
        </span>

        {/* Wordmark */}
        <div className="mt-8 flex items-center gap-2">
          <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl shadow-sm">
            <Rocket className="size-5" />
          </span>
          <span className="text-xl font-semibold tracking-tight">ShipFlow AI</span>
        </div>

        {/* Headline */}
        <h1 className="mt-8 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Ship products faster, with AI in the loop.
        </h1>
        <p className="text-muted-foreground mt-5 max-w-xl text-base text-pretty sm:text-lg">
          From a feature request to a shipped change — ShipFlow turns ideas into PRDs, tasks, and
          code, then reviews every pull request against the spec before a human approves it.
        </p>

        {/* Pipeline */}
        <div className="text-muted-foreground mt-10 flex flex-wrap items-center justify-center gap-x-1 gap-y-2 text-xs font-medium">
          {PIPELINE.map((step, i) => {
            const Icon = step.icon;
            return (
              <span key={step.label} className="flex items-center gap-1">
                <span className="border-border bg-card flex items-center gap-1.5 rounded-full border px-2.5 py-1">
                  <Icon className="size-3.5" />
                  {step.label}
                </span>
                {i < PIPELINE.length - 1 ? (
                  <ChevronRight className="text-muted-foreground/50 size-3.5" />
                ) : null}
              </span>
            );
          })}
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-11 px-6 text-base">
            <Link href="/signup">
              Get Started
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-11 px-6 text-base">
            <Link href="/signin">Sign in</Link>
          </Button>
        </div>

        <p className="text-muted-foreground/70 mt-8 text-xs">
          Be the first to ship with AI review — get started in under a minute.
        </p>
      </div>
    </main>
  );
}
