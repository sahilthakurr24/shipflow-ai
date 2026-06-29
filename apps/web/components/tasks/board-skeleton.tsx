import { Skeleton } from "~/components/ui/skeleton";
import { BOARD_COLUMNS } from "./columns";

export function BoardSkeleton() {
  return (
    <div className="flex h-full gap-4 overflow-hidden">
      {BOARD_COLUMNS.map((column, i) => (
        <div key={column.status} className="flex w-[300px] shrink-0 flex-col gap-3">
          <div className="flex items-center gap-2 px-1 py-2">
            <Skeleton className="size-4 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex flex-col gap-2.5 p-1.5">
            {Array.from({ length: Math.max(1, 3 - i) }).map((_, j) => (
              <Skeleton key={j} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
