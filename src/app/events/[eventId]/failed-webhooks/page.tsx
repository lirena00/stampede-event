import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { AlertTriangle, CheckCircle, Clock, Trash2, Edit } from "lucide-react";
import { getAllFailedWebhooks } from "~/server/queries";

export const dynamic = "force-dynamic";

async function EventFailedWebhooksContent({ eventId }: { eventId: string }) {
  const failedWebhooks = await getAllFailedWebhooks();

  if (failedWebhooks.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardHeader>
          <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
          <CardTitle>No Failed Webhooks</CardTitle>
          <CardDescription>
            All webhooks for Event {eventId} are processing successfully.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Failed webhooks will appear here if there are any processing issues.
          </p>
        </CardContent>
      </Card>
    );
  }

  const pendingCount = failedWebhooks.filter(
    (w) => w.status === "pending"
  ).length;
  const resolvedCount = failedWebhooks.filter(
    (w) => w.status === "resolved"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Failed Webhooks</h1>
          <p className="text-muted-foreground">
            Webhook failures for Event {eventId}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={pendingCount > 0 ? "destructive" : "secondary"}>
            {pendingCount} Pending
          </Badge>
          <Badge variant="secondary">{resolvedCount} Resolved</Badge>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <CardTitle className="text-sm font-medium">
                Total Failed
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedWebhooks.length}</div>
            <p className="text-xs text-muted-foreground">webhook failures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedCount}</div>
            <p className="text-xs text-muted-foreground">
              successfully handled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Failed Webhooks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Failed Webhook Details</CardTitle>
          <CardDescription>
            Review and manage webhook processing failures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Error Message</TableHead>
                  <TableHead>Extracted Data</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failedWebhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-medium">#{webhook.id}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          webhook.status === "pending"
                            ? "destructive"
                            : webhook.status === "resolved"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {webhook.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={webhook.error_message}>
                        {webhook.error_message}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        {webhook.extracted_name && (
                          <div>
                            <strong>Name:</strong> {webhook.extracted_name}
                          </div>
                        )}
                        {webhook.extracted_email && (
                          <div>
                            <strong>Email:</strong> {webhook.extracted_email}
                          </div>
                        )}
                        {webhook.extracted_phone && (
                          <div>
                            <strong>Phone:</strong> {webhook.extracted_phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {webhook.created_at
                        ? new Date(webhook.created_at).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                        {webhook.status === "pending" && (
                          <Button variant="default" size="sm">
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FailedWebhooksLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-20 bg-muted animate-pulse rounded" />
          <div className="h-6 w-20 bg-muted animate-pulse rounded" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={`stat-${i}`}
            className="h-24 bg-muted animate-pulse rounded-lg"
          />
        ))}
      </div>

      <div className="h-96 bg-muted animate-pulse rounded-lg" />
    </div>
  );
}

interface FailedWebhooksPageProps {
  params: Promise<{
    eventId: string;
  }>;
}

export default async function EventFailedWebhooksPage({
  params,
}: FailedWebhooksPageProps) {
  const { eventId } = await params;

  return (
    <Suspense fallback={<FailedWebhooksLoadingSkeleton />}>
      <EventFailedWebhooksContent eventId={eventId} />
    </Suspense>
  );
}
