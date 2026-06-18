import { Card, Skeleton, SkeletonPanel } from "@/components/ui";

export function DashboardSkeleton() {
  return (
    <SkeletonPanel>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} variant="summary">
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="mt-4 h-9 w-28" />
            <Skeleton className="mt-3 h-4 w-36" />
            <Skeleton className="mt-5 h-11 w-full" />
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <ListPanelSkeleton />
        <ListPanelSkeleton />
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <ListPanelSkeleton />
        <ListPanelSkeleton />
      </div>
    </SkeletonPanel>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <SkeletonPanel>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} variant="summary">
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="mt-4 h-9 w-24" />
            <Skeleton className="mt-5 h-11 w-full" />
          </Card>
        ))}
      </div>
      <Card variant="list" className="mt-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </Card>
    </SkeletonPanel>
  );
}

export function MemberListSkeleton() {
  return (
    <SkeletonPanel>
      <div className="grid gap-4 md:hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} variant="list" padding="compact">
            <div className="flex items-start gap-4">
              <Skeleton className="size-12 rounded-full" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-7 w-16 rounded-full" />
                </div>
                <Skeleton className="mt-3 h-4 w-44" />
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3">
          {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-4 w-20" />)}
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] items-center gap-4 px-4 py-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-12 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="mt-2 h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-7 w-16 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="ml-auto h-8 w-12" />
            </div>
          ))}
        </div>
      </div>
      <Skeleton className="mt-5 h-16 w-full" />
    </SkeletonPanel>
  );
}

export function ReportListSkeleton() {
  return (
    <SkeletonPanel>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} variant="list" padding="compact" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>
              <Skeleton className="mt-3 h-4 w-64 max-w-full" />
              <Skeleton className="mt-2 h-3 w-32" />
            </div>
            <Skeleton className="h-11 w-full sm:w-24" />
          </Card>
        ))}
      </div>
    </SkeletonPanel>
  );
}

export function ReportDetailSkeleton() {
  return (
    <SkeletonPanel>
      <Card variant="sensitive">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="mt-6 h-4 w-28" />
        <Skeleton className="mt-3 h-20 w-full" />
      </Card>
      <section className="mt-5">
        <Skeleton className="h-7 w-28" />
        <div className="mt-4 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} variant="sensitive" padding="compact">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-7 w-16 rounded-full" />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </section>
    </SkeletonPanel>
  );
}

function ListPanelSkeleton() {
  return (
    <Card variant="list">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-11 w-24" />
      </div>
      <div className="mt-4 space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Skeleton className="h-5 w-24" />
                <Skeleton className="mt-2 h-3 w-36" />
              </div>
              <Skeleton className="h-7 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
