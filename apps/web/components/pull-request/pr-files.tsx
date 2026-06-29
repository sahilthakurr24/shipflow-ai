"use client";

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { cn } from "~/lib/utils";
import type { PullRequestFile } from "./shared";

function DiffLines({ patch }: { patch: string }) {
  return (
    <pre className="bg-muted/30 overflow-x-auto py-1 font-mono text-xs leading-relaxed">
      <code>
        {patch.split("\n").map((line, i) => {
          const isAdd = line.startsWith("+") && !line.startsWith("+++");
          const isDel = line.startsWith("-") && !line.startsWith("---");
          const isHunk = line.startsWith("@@");
          return (
            <div
              key={i}
              className={cn(
                "px-3 whitespace-pre",
                isAdd && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                isDel && "bg-red-500/10 text-red-700 dark:text-red-300",
                isHunk && "bg-muted text-muted-foreground",
              )}
            >
              {line || " "}
            </div>
          );
        })}
      </code>
    </pre>
  );
}

function FileRow({ file, defaultOpen }: { file: PullRequestFile; defaultOpen: boolean }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="hover:bg-muted/50 flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors"
      >
        {open ? (
          <ChevronDown className="text-muted-foreground size-4 shrink-0" />
        ) : (
          <ChevronRight className="text-muted-foreground size-4 shrink-0" />
        )}
        <span className="truncate font-mono text-xs">{file.filename}</span>
        <span className="text-muted-foreground ml-auto shrink-0 text-xs">
          <span className="capitalize">{file.status}</span>{" "}
          <span className="text-emerald-600 dark:text-emerald-400">+{file.additions}</span>{" "}
          <span className="text-red-600 dark:text-red-400">-{file.deletions}</span>
        </span>
      </button>
      {open ? (
        file.patch ? (
          <DiffLines patch={file.patch} />
        ) : (
          <p className="text-muted-foreground border-t px-3 py-2 text-xs">
            No diff available (binary or too large).
          </p>
        )
      ) : null}
    </div>
  );
}

export function PrFiles({ files }: { files: PullRequestFile[] }) {
  if (!files.length) {
    return <p className="text-muted-foreground/70 text-sm italic">No changed files.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {files.map((file, i) => (
        <FileRow key={file.id} file={file} defaultOpen={i < 2} />
      ))}
    </div>
  );
}
