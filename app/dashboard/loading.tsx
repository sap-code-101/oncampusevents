import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Loading Your Dashboard...</p>
    </div>
  );
}