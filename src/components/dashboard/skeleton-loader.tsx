import { Skeleton } from "@/components/ui/skeleton";

export default function SkeletonLoader() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-56" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-36 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}
