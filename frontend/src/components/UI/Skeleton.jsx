import { cn } from '../../utils/helpers';

const Skeleton = ({ className, ...props }) => (
  <div
    className={cn('skeleton rounded-md', className)}
    {...props}
  />
);

export const TaskCardSkeleton = () => (
  <div className="bg-surface border border-border rounded-lg p-3 space-y-2.5">
    <Skeleton className="h-3.5 w-3/4" />
    <Skeleton className="h-3 w-1/2" />
    <div className="flex items-center justify-between pt-1">
      <Skeleton className="h-4 w-14 rounded-full" />
      <Skeleton className="h-5 w-5 rounded-full" />
    </div>
  </div>
);

export const KanbanColumnSkeleton = () => (
  <div className="flex flex-col gap-2">
    <TaskCardSkeleton />
    <TaskCardSkeleton />
    <TaskCardSkeleton />
  </div>
);

export const StatCardSkeleton = () => (
  <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-3.5 w-20" />
      <Skeleton className="h-7 w-7 rounded-lg" />
    </div>
    <Skeleton className="h-7 w-16" />
    <Skeleton className="h-3 w-28" />
  </div>
);

export const ActivityItemSkeleton = () => (
  <div className="flex items-start gap-3 py-2">
    <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
    <div className="flex-1 space-y-1.5">
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  </div>
);

export const ProjectCardSkeleton = () => (
  <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
    <div className="flex items-center gap-3">
      <Skeleton className="h-8 w-8 rounded-lg" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    <Skeleton className="h-1.5 w-full rounded-full" />
    <div className="flex gap-2">
      <Skeleton className="h-5 w-5 rounded-full" />
      <Skeleton className="h-5 w-5 rounded-full" />
      <Skeleton className="h-5 w-5 rounded-full" />
    </div>
  </div>
);

export default Skeleton;
