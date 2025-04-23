import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="flex flex-col justify-between items-center mt-5">
      <div className="w-full max-w-4xl space-y-8 px-4 flex justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
          <Skeleton className="w-[110px] h-[34px] rounded-2" />
        </h1>

        <div className="flex gap-2">
          <Skeleton className="w-[34px] h-[34px] rounded-2" />
          <Skeleton className="w-[34px] h-[34px] rounded-2" />
        </div>
      </div>
      <div className="w-full max-w-4xl space-y-8 px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Skeleton className="h-12 w-12 rounded-full" />

            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              <Skeleton className="w-[250px] h-[40px] rounded-2" />
            </h1>
          </div>
        </div>

        <div>
          <Skeleton className="w-full h-[60px] rounded-2" />
        </div>

        <div>
          <Skeleton className="w-full h-[150px] rounded-2" />
        </div>
      </div>
    </main>
  );
}
