"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { toast } from "~/hooks/use-toast";
import Header from "~/components/Header";
import { Skeleton } from "~/components/ui/skeleton";
import {
  AlertTriangle,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar,
  Code,
  User,
  Mail,
  Phone,
  CreditCard,
  Image,
  FileText,
  RefreshCw,
} from "lucide-react";

type FailedWebhook = {
  id: number;
  raw_data: string;
  error_message: string;
  error_details: string;
  status: string;
  extracted_name: string;
  extracted_email: string;
  extracted_phone: string;
  extracted_transaction_id: string;
  extracted_screenshot: string;
  notes: string;
  created_at: string;
  resolved_at: string | null;
};

export default function FailedWebhooksPage() {
  const [failedWebhooks, setFailedWebhooks] = useState<FailedWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingWebhook, setEditingWebhook] = useState<FailedWebhook | null>(
    null,
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [webhookToDelete, setWebhookToDelete] = useState<number | null>(null);
  const [viewRawData, setViewRawData] = useState<string | null>(null);

  const fetchFailedWebhooks = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/failed-webhooks");
      const data = await response.json();

      if (data.success) {
        setFailedWebhooks(data.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch failed webhooks",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch failed webhooks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFailedWebhooks();
  }, []);

  const handleEdit = (webhook: FailedWebhook) => {
    setEditingWebhook(webhook);
  };

  const handleSave = async () => {
    if (!editingWebhook) return;

    try {
      const response = await fetch("/api/failed-webhooks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingWebhook.id,
          extracted_name: editingWebhook.extracted_name,
          extracted_email: editingWebhook.extracted_email,
          extracted_phone: editingWebhook.extracted_phone,
          extracted_transaction_id: editingWebhook.extracted_transaction_id,
          extracted_screenshot: editingWebhook.extracted_screenshot,
          notes: editingWebhook.notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Failed webhook updated successfully",
        });
        setEditingWebhook(null);
        fetchFailedWebhooks();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update webhook",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update webhook",
        variant: "destructive",
      });
    }
  };

  const handleResolve = async (id: number) => {
    try {
      const response = await fetch("/api/failed-webhooks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          action: "resolve",
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Webhook resolved and participant added successfully",
        });
        fetchFailedWebhooks();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to resolve webhook",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve webhook",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!webhookToDelete) return;

    try {
      const response = await fetch(
        `/api/failed-webhooks?id=${webhookToDelete}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Failed webhook deleted successfully",
        });
        fetchFailedWebhooks();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete webhook",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete webhook",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setWebhookToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Resolved
          </Badge>
        );
      case "ignored":
        return (
          <Badge variant="secondary">
            <XCircle className="mr-1 h-3 w-3" />
            Ignored
          </Badge>
        );
      default:
        return (
          <Badge variant="destructive">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <main className="bg-background flex min-h-screen flex-col">
        <div className="container mx-auto space-y-8 px-4 py-6">
          <Header />
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-background flex min-h-screen flex-col">
      <div className="container mx-auto space-y-8 px-4 py-6">
        <Header />

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Failed Webhooks
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage and resolve webhook processing failures
            </p>
          </div>
          <Button
            onClick={fetchFailedWebhooks}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Failed
              </CardTitle>
              <AlertTriangle className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{failedWebhooks.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <XCircle className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {failedWebhooks.filter((w) => w.status === "pending").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {failedWebhooks.filter((w) => w.status === "resolved").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Failed Webhooks Table */}
        <Card>
          <CardHeader>
            <CardTitle>Failed Webhook Entries</CardTitle>
            <CardDescription>
              Review and resolve webhook processing failures
            </CardDescription>
          </CardHeader>
          <CardContent>
            {failedWebhooks.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
                <h3 className="text-lg font-medium">No Failed Webhooks</h3>
                <p className="text-muted-foreground">
                  All webhook requests are processing successfully!
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Extracted Data</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {failedWebhooks.map((webhook) => (
                      <TableRow key={webhook.id}>
                        <TableCell>{getStatusBadge(webhook.status)}</TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            {webhook.extracted_name && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {webhook.extracted_name}
                              </div>
                            )}
                            {webhook.extracted_email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {webhook.extracted_email}
                              </div>
                            )}
                            {webhook.extracted_phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {webhook.extracted_phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="truncate text-sm font-medium text-red-600">
                              {webhook.error_message}
                            </p>
                            {webhook.error_details && (
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs"
                                onClick={() =>
                                  setViewRawData(webhook.error_details)
                                }
                              >
                                View Details
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-muted-foreground flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {formatDate(webhook.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(webhook)}
                              disabled={webhook.status === "resolved"}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleResolve(webhook.id)}
                              disabled={
                                webhook.status === "resolved" ||
                                !webhook.extracted_name ||
                                !webhook.extracted_email
                              }
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setWebhookToDelete(webhook.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog
          open={!!editingWebhook}
          onOpenChange={() => setEditingWebhook(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Failed Webhook</DialogTitle>
              <DialogDescription>
                Review and correct the extracted participant data
              </DialogDescription>
            </DialogHeader>

            {editingWebhook && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={editingWebhook.extracted_name}
                      onChange={(e) =>
                        setEditingWebhook({
                          ...editingWebhook,
                          extracted_name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editingWebhook.extracted_email}
                      onChange={(e) =>
                        setEditingWebhook({
                          ...editingWebhook,
                          extracted_email: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={editingWebhook.extracted_phone}
                      onChange={(e) =>
                        setEditingWebhook({
                          ...editingWebhook,
                          extracted_phone: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transactionId">Transaction ID</Label>
                    <Input
                      id="transactionId"
                      value={editingWebhook.extracted_transaction_id}
                      onChange={(e) =>
                        setEditingWebhook({
                          ...editingWebhook,
                          extracted_transaction_id: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="screenshot">Screenshot URL</Label>
                  <Input
                    id="screenshot"
                    value={editingWebhook.extracted_screenshot}
                    onChange={(e) =>
                      setEditingWebhook({
                        ...editingWebhook,
                        extracted_screenshot: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={editingWebhook.notes}
                    onChange={(e) =>
                      setEditingWebhook({
                        ...editingWebhook,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Add any notes about this failed webhook..."
                  />
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Original Error:</strong>{" "}
                    {editingWebhook.error_message}
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Raw Webhook Data</Label>
                  <div className="bg-muted max-h-32 overflow-y-auto rounded border p-3">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(
                        JSON.parse(editingWebhook.raw_data),
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingWebhook(null)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Raw Data View Dialog */}
        <Dialog open={!!viewRawData} onOpenChange={() => setViewRawData(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Error Details</DialogTitle>
            </DialogHeader>
            <div className="bg-muted max-h-96 overflow-y-auto rounded border p-4">
              <pre className="text-xs whitespace-pre-wrap">
                {viewRawData &&
                  JSON.stringify(JSON.parse(viewRawData), null, 2)}
              </pre>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                failed webhook entry.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </main>
  );
}
