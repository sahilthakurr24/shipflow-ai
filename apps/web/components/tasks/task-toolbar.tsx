"use client";

import * as React from "react";
import { ArrowUpDown, Filter, Plus, RefreshCw, Search, Sparkles, X } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import {
  PRIORITY_META,
  type SortKey,
  TASK_PRIORITIES,
  TASK_TYPES,
  type TaskPriority,
  type TaskType,
  TYPE_LABEL,
} from "./columns";

export type { SortKey };

export type BoardFilters = {
  priorities: TaskPriority[];
  types: TaskType[];
  aiOnly: boolean;
};

export const EMPTY_FILTERS: BoardFilters = { priorities: [], types: [], aiOnly: false };

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

const SORT_LABEL: Record<SortKey, string> = {
  manual: "Board order",
  priority: "Priority",
  recent: "Recently updated",
};

export function TaskToolbar({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  onCreate,
  onGenerate,
  onRefresh,
  refreshing,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  filters: BoardFilters;
  onFiltersChange: (filters: BoardFilters) => void;
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
  onCreate: () => void;
  onGenerate: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const activeFilterCount =
    filters.priorities.length + filters.types.length + (filters.aiOnly ? 1 : 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] flex-1">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks…"
          className="h-9 pl-8"
        />
        {search ? (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {/* Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            <Filter className="size-4" />
            Filter
            {activeFilterCount ? (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 tabular-nums">
                {activeFilterCount}
              </Badge>
            ) : null}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Priority</DropdownMenuLabel>
          {TASK_PRIORITIES.map((p) => (
            <DropdownMenuCheckboxItem
              key={p}
              checked={filters.priorities.includes(p)}
              onCheckedChange={() =>
                onFiltersChange({ ...filters, priorities: toggle(filters.priorities, p) })
              }
              onSelect={(e) => e.preventDefault()}
            >
              {PRIORITY_META[p].label}
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Type</DropdownMenuLabel>
          {TASK_TYPES.map((t) => (
            <DropdownMenuCheckboxItem
              key={t}
              checked={filters.types.includes(t)}
              onCheckedChange={() => onFiltersChange({ ...filters, types: toggle(filters.types, t) })}
              onSelect={(e) => e.preventDefault()}
            >
              {TYPE_LABEL[t]}
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={filters.aiOnly}
            onCheckedChange={(v) => onFiltersChange({ ...filters, aiOnly: Boolean(v) })}
            onSelect={(e) => e.preventDefault()}
          >
            AI-generated only
          </DropdownMenuCheckboxItem>
          {activeFilterCount ? (
            <>
              <DropdownMenuSeparator />
              <button
                type="button"
                onClick={() => onFiltersChange(EMPTY_FILTERS)}
                className="text-muted-foreground hover:text-foreground w-full px-2 py-1.5 text-left text-sm"
              >
                Clear filters
              </button>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sort */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            <ArrowUpDown className="size-4" />
            {SORT_LABEL[sort]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Sort within column</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={sort} onValueChange={(v) => onSortChange(v as SortKey)}>
            {(Object.keys(SORT_LABEL) as SortKey[]).map((key) => (
              <DropdownMenuRadioItem key={key} value={key}>
                {SORT_LABEL[key]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Group By (status only for now) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            Group: Status
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Group by</DropdownMenuLabel>
          <DropdownMenuRadioGroup value="status">
            <DropdownMenuRadioItem value="status">Status</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <p className="text-muted-foreground/70 px-2 py-1 text-xs">Priority &amp; assignee soon</p>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          onClick={onRefresh}
          aria-label="Refresh"
          disabled={refreshing}
        >
          <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
        </Button>
        <Button variant="outline" size="sm" className="h-9" onClick={onGenerate}>
          <Sparkles className="size-4" />
          AI Generate
        </Button>
        <Button size="sm" className="h-9" onClick={onCreate}>
          <Plus className="size-4" />
          New task
        </Button>
      </div>
    </div>
  );
}
