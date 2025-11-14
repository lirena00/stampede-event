"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Label } from "~/components/ui/label";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { toast } from "~/hooks/use-toast";
import {
  Upload,
  FileCheck,
  AlertTriangle,
  Loader2,
  FileSpreadsheet,
  CloudUpload,
  UserPlus,
} from "lucide-react";
import { processCsvUpload, createManualParticipant } from "~/server/actions";

type UploadResult = {
  success: boolean;
  addedCount?: number;
  skippedCount?: number;
  errorCount?: number;
  errors?: Array<{ row: number; error: string }>;
  message: string;
};

type ManualParticipant = {
  name: string;
  email: string;
  phone: string;
  transactionId: string;
  screenshot: string;
  status: string;
};

interface EventUploadPageProps {
  params: Promise<{
    eventId: string;
  }>;
}

export default function EventUploadPage({ params }: EventUploadPageProps) {
  const [eventId, setEventId] = useState<string>("");

  // Extract eventId from params on mount
  useEffect(() => {
    params.then(({ eventId: id }) => {
      setEventId(id);
    });
  }, [params]);

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualParticipant, setManualParticipant] = useState<ManualParticipant>(
    {
      name: "",
      email: "",
      phone: "",
      transactionId: "",
      screenshot: "",
      status: "registered",
    }
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile && selectedFile.type === "text/csv") {
        setFile(selectedFile);
        setResult(null);
      } else {
        setFile(null);
        setResult({
          success: false,
          message: "Please select a valid CSV file",
        });
      }
    },
    []
  );

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const csvContent = await file.text();
      const data = await processCsvUpload(csvContent);
      setResult(data);

      if (data.success) {
        toast({
          title: "Upload successful",
          description: data.message,
        });
        setFile(null);
        // Clear file input
        const fileInput = document.querySelector(
          'input[type="file"]'
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        toast({
          title: "Upload failed",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setResult({
        success: false,
        message: "An error occurred during upload",
      });
      toast({
        title: "Upload failed",
        description: "An error occurred during upload",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualAdd = async () => {
    if (!manualParticipant.name || !manualParticipant.email) {
      toast({
        title: "Missing information",
        description: "Name and email are required",
        variant: "destructive",
      });
      return;
    }

    setManualLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", manualParticipant.name);
      formData.append("email", manualParticipant.email);
      formData.append("phone", manualParticipant.phone);
      formData.append("transactionId", manualParticipant.transactionId);
      formData.append("screenshot", manualParticipant.screenshot);
      formData.append("status", manualParticipant.status);

      const data = await createManualParticipant(formData);

      if (data.success) {
        toast({
          title: "Participant added",
          description: data.message,
        });
        setManualParticipant({
          name: "",
          email: "",
          phone: "",
          transactionId: "",
          screenshot: "",
          status: "registered",
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to add participant",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Manual add error:", error);
      toast({
        title: "Error",
        description: "An error occurred while adding participant",
        variant: "destructive",
      });
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Upload Participants
          </h1>
          <p className="text-muted-foreground">
            Add participants to Event {eventId}
          </p>
        </div>
      </div>

      <Tabs defaultValue="csv-upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="csv-upload" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            CSV Upload
          </TabsTrigger>
          <TabsTrigger value="manual-add" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Manual Add
          </TabsTrigger>
        </TabsList>

        <TabsContent value="csv-upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CloudUpload className="h-5 w-5" />
                CSV File Upload
              </CardTitle>
              <CardDescription>
                Upload a CSV file containing participant information for this
                event.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csv-file">Select CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={loading}
                />
                <p className="text-sm text-muted-foreground">
                  CSV should contain columns: name, email, phone,
                  transaction_id, screenshot, status
                </p>
              </div>

              {file && (
                <Alert>
                  <FileCheck className="h-4 w-4" />
                  <AlertDescription>
                    File selected: <strong>{file.name}</strong> (
                    {(file.size / 1024).toFixed(2)} KB)
                  </AlertDescription>
                </Alert>
              )}

              {result && (
                <Alert variant={result.success ? "default" : "destructive"}>
                  {result.success ? (
                    <FileCheck className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    <div className="space-y-2">
                      <p>{result.message}</p>
                      {result.success && (
                        <div className="text-sm space-y-1">
                          {result.addedCount !== undefined && (
                            <p>Added: {result.addedCount} participants</p>
                          )}
                          {result.skippedCount !== undefined &&
                            result.skippedCount > 0 && (
                              <p>
                                Skipped: {result.skippedCount} (already exist)
                              </p>
                            )}
                          {result.errorCount !== undefined &&
                            result.errorCount > 0 && (
                              <p>Errors: {result.errorCount}</p>
                            )}
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleUpload}
                disabled={!file || loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload CSV
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* CSV Format Help */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">CSV Format Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your CSV file should include the following columns:
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Column</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Required</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">name</TableCell>
                      <TableCell>Participant&apos;s full name</TableCell>
                      <TableCell>
                        <Badge variant="destructive">Yes</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">email</TableCell>
                      <TableCell>Email address</TableCell>
                      <TableCell>
                        <Badge variant="destructive">Yes</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">phone</TableCell>
                      <TableCell>Phone number</TableCell>
                      <TableCell>
                        <Badge variant="secondary">No</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        transaction_id
                      </TableCell>
                      <TableCell>Payment transaction ID</TableCell>
                      <TableCell>
                        <Badge variant="secondary">No</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">screenshot</TableCell>
                      <TableCell>Payment screenshot URL</TableCell>
                      <TableCell>
                        <Badge variant="secondary">No</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">status</TableCell>
                      <TableCell>Registration status</TableCell>
                      <TableCell>
                        <Badge variant="secondary">No</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual-add" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Add Single Participant
              </CardTitle>
              <CardDescription>
                Manually add a participant to this event.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="manual-name">Full Name *</Label>
                  <Input
                    id="manual-name"
                    value={manualParticipant.name}
                    onChange={(e) =>
                      setManualParticipant({
                        ...manualParticipant,
                        name: e.target.value,
                      })
                    }
                    placeholder="Enter participant's name"
                    disabled={manualLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-email">Email Address *</Label>
                  <Input
                    id="manual-email"
                    type="email"
                    value={manualParticipant.email}
                    onChange={(e) =>
                      setManualParticipant({
                        ...manualParticipant,
                        email: e.target.value,
                      })
                    }
                    placeholder="Enter email address"
                    disabled={manualLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-phone">Phone Number</Label>
                  <Input
                    id="manual-phone"
                    value={manualParticipant.phone}
                    onChange={(e) =>
                      setManualParticipant({
                        ...manualParticipant,
                        phone: e.target.value,
                      })
                    }
                    placeholder="Enter phone number"
                    disabled={manualLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-transaction">Transaction ID</Label>
                  <Input
                    id="manual-transaction"
                    value={manualParticipant.transactionId}
                    onChange={(e) =>
                      setManualParticipant({
                        ...manualParticipant,
                        transactionId: e.target.value,
                      })
                    }
                    placeholder="Enter transaction ID"
                    disabled={manualLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-screenshot">Screenshot URL</Label>
                <Input
                  id="manual-screenshot"
                  value={manualParticipant.screenshot}
                  onChange={(e) =>
                    setManualParticipant({
                      ...manualParticipant,
                      screenshot: e.target.value,
                    })
                  }
                  placeholder="Enter screenshot URL"
                  disabled={manualLoading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleManualAdd}
                disabled={
                  manualLoading ||
                  !manualParticipant.name ||
                  !manualParticipant.email
                }
                className="w-full"
              >
                {manualLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Participant
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
