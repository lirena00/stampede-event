import { Loader2, Mail } from "lucide-react";

export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="space-y-4 text-center">
        <Mail className="text-muted-foreground mx-auto h-12 w-12" />
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Loading Email Tickets</h2>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-muted-foreground text-sm">
              Preparing email ticket system...
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
