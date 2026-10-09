import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("lms-skeleton rounded-lg", className)}
      {...props}
    />
  );
}

function SkeletonText({
  lines = 1,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-3.5 rounded-md",
            i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

function SkeletonAvatar({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = { sm: "w-8 h-8", md: "w-10 h-10", lg: "w-12 h-12" };
  return (
    <Skeleton className={cn("rounded-full shrink-0", sizes[size], className)} />
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <SkeletonAvatar />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-1/2 rounded-md" />
          <Skeleton className="h-3 w-1/3 rounded-md" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

function SkeletonTable({
  rows = 5,
  cols = 4,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden", className)}>
      {/* Header */}
      <div className="flex gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50/80">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1 rounded-md" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex gap-4 px-6 py-4 border-b border-slate-50 items-center"
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              className={cn("h-3.5 rounded-md", colIdx === 0 ? "w-24" : "flex-1")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function SkeletonKPICard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="w-14 h-5 rounded-full" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="w-20 h-7 rounded-lg" />
        <Skeleton className="w-28 h-3.5 rounded-md" />
        <Skeleton className="w-20 h-3 rounded-md" />
      </div>
    </div>
  );
}

export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonTable,
  SkeletonKPICard,
};
