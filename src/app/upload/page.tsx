/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
"use client";

import { useState } from "react";
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
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import Header from "~/components/Header";
import { Skeleton } from "~/components/ui/skeleton";
import { Spinner } from "~/components/ui/spinner";
import { toast } from "~/hooks/use-toast";
import {
  Upload,
  FileCheck,
  AlertTriangle,
  Loader2,
  CheckCircle,
  XCircle,
  HelpCircle,
  Download,
  Users,
  FileSpreadsheet,
  Info,
  CloudUpload,
  UserPlus,
  Save,
  Plus,
} from "lucide-react";

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

export default function UploadPage() {
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
    },
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        const fileInput = document.getElementById(
          "csvFile",
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        if (!data.errorCount || data.errorCount === 0) {
          setFile(null);
        }
      }
    } catch (error) {
      setResult({
        success: false,
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent =
      "Full Name,Email Address,WhatsApp Number,UPI ID,Screenshot of transaction\nJohn Doe,john@example.com,9876543210,john@upi,https://example.com/screenshot.jpg\nJane Smith,jane@example.com,9876543211,jane@upi,https://example.com/screenshot2.jpg\n";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "participants-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleManualInputChange = (
    field: keyof ManualParticipant,
    value: string,
  ) => {
    setManualParticipant((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!manualParticipant.name || !manualParticipant.email) return;

    setManualLoading(true);

    try {
      const response = await fetch("/api/manual-participant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(manualParticipant),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Participant added successfully!",
        });

        // Reset form
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
          description: data.error || "Failed to add participant",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add participant",
        variant: "destructive",
      });
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <main className="bg-background flex min-h-screen flex-col">
      <div className="container mx-auto space-y-8 px-4 py-6">
        <Header />

        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Add Participants
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Import participant data from CSV files or add them manually
          </p>
        </div>

        <Tabs defaultValue="csv-upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="csv-upload" className="gap-2">
              <CloudUpload className="h-4 w-4" />
              CSV Upload
            </TabsTrigger>
            <TabsTrigger value="manual-entry" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Manual Entry
            </TabsTrigger>
          </TabsList>

          {/* CSV Upload Tab */}
          <TabsContent value="csv-upload" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main Upload Card */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CloudUpload className="h-5 w-5" />
                      CSV File Upload
                    </CardTitle>
                    <CardDescription>
                      Upload your participant data in CSV format
                    </CardDescription>
                  </CardHeader>

                  <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                      {/* File Upload Section */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor="csvFile"
                            className="text-sm font-medium"
                          >
                            Select CSV File
                          </label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={downloadTemplate}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download Template
                          </Button>
                        </div>

                        <div className="space-y-3">
                          <div
                            className="border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer rounded-lg border-2 border-dashed p-6 transition-colors"
                            onClick={() =>
                              document.getElementById("csvFile")?.click()
                            }
                          >
                            <Input
                              id="csvFile"
                              type="file"
                              accept=".csv"
                              onChange={handleFileChange}
                              disabled={loading}
                              className="hidden"
                            />
                            <div className="flex flex-col items-center gap-2 text-center">
                              <CloudUpload className="text-muted-foreground h-8 w-8" />
                              <div>
                                <p className="text-sm font-medium">
                                  Click to upload or drag and drop
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  CSV files up to 10MB
                                </p>
                              </div>
                            </div>
                          </div>
                          {file && (
                            <div className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                              <div className="flex min-w-0 items-center gap-2">
                                <FileCheck className="h-5 w-5 shrink-0 text-green-600" />
                                <span className="truncate text-sm font-medium">
                                  {file.name}
                                </span>
                              </div>
                              <Badge variant="outline" className="shrink-0">
                                {(file.size / 1024).toFixed(1)} KB
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Upload Result */}
                      {result && (
                        <Alert
                          className={
                            !result.success
                              ? "border-destructive bg-destructive/10"
                              : result.errorCount && result.errorCount > 0
                                ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                                : "border-green-500 bg-green-50 dark:bg-green-900/20"
                          }
                        >
                          <div className="flex items-start gap-3">
                            {!result.success ? (
                              <AlertTriangle className="text-destructive h-5 w-5" />
                            ) : result.errorCount && result.errorCount > 0 ? (
                              <HelpCircle className="h-5 w-5 text-yellow-600" />
                            ) : (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            )}
                            <div className="flex-1">
                              <AlertDescription className="font-medium">
                                {result.message}
                              </AlertDescription>

                              {result.success &&
                                result.addedCount !== undefined && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <Badge
                                      variant="secondary"
                                      className="gap-1 bg-green-100 text-green-800"
                                    >
                                      <CheckCircle className="h-3 w-3" />
                                      Added: {result.addedCount}
                                    </Badge>
                                    <Badge
                                      variant="secondary"
                                      className="gap-1 bg-blue-100 text-blue-800"
                                    >
                                      <FileCheck className="h-3 w-3" />
                                      Skipped: {result.skippedCount}
                                    </Badge>
                                    <Badge
                                      variant="secondary"
                                      className={`gap-1 ${
                                        result.errorCount &&
                                        result.errorCount > 0
                                          ? "bg-red-100 text-red-800"
                                          : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      <XCircle className="h-3 w-3" />
                                      Errors: {result.errorCount}
                                    </Badge>
                                  </div>
                                )}
                            </div>
                          </div>
                        </Alert>
                      )}

                      {/* Error Details Table */}
                      {result?.errors && result.errors.length > 0 && (
                        <Card className="border-destructive">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-destructive flex items-center gap-2 text-lg">
                              <XCircle className="h-5 w-5" />
                              Error Details
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="max-h-60 overflow-y-auto rounded border">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-20">Row</TableHead>
                                    <TableHead>Error Description</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {result.errors.map((error, i) => (
                                    <TableRow key={i}>
                                      <TableCell className="font-mono">
                                        {error.row}
                                      </TableCell>
                                      <TableCell className="text-destructive">
                                        {error.error}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </CardContent>

                    <CardFooter>
                      <Button
                        type="submit"
                        className="w-full gap-2"
                        disabled={loading || !file}
                      >
                        {loading ? (
                          <>
                            <Spinner className="h-4 w-4" />
                            Processing Upload...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Upload Participants
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </div>

              {/* Sidebar Information */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Info className="h-5 w-5" />
                      CSV Format Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="mb-2 font-medium">Required Columns:</h4>
                      <ul className="text-muted-foreground space-y-1 text-sm">
                        <li>• Full Name</li>
                        <li>• Email Address</li>
                        <li>• WhatsApp Number (or Whatsapp Number)</li>
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="mb-2 font-medium">Optional Columns:</h4>
                      <ul className="text-muted-foreground space-y-1 text-sm">
                        <li>• UPI ID</li>
                        <li>• Screenshot of transaction</li>
                      </ul>
                    </div>

                    <Separator />

                    <Alert>
                      <FileSpreadsheet className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Download the template file to see the exact format
                        required for successful upload.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="h-5 w-5" />
                      Upload Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-muted-foreground space-y-2 text-sm">
                      <li>• Ensure all email addresses are valid</li>
                      <li>• Phone numbers should include country code</li>
                      <li>• Duplicate entries will be skipped automatically</li>
                      <li>• Maximum file size: 10MB</li>
                      <li>• Encoding should be UTF-8</li>
                      <li>• Compatible with Google Forms exports</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Manual Entry Tab */}
          <TabsContent value="manual-entry" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Add Participant Manually
                    </CardTitle>
                    <CardDescription>
                      Enter participant details individually
                    </CardDescription>
                  </CardHeader>

                  <form onSubmit={handleManualSubmit}>
                    <CardContent className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="manual-name">Full Name *</Label>
                          <Input
                            id="manual-name"
                            type="text"
                            value={manualParticipant.name}
                            onChange={(e) =>
                              handleManualInputChange("name", e.target.value)
                            }
                            placeholder="Enter full name"
                            required
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
                              handleManualInputChange("email", e.target.value)
                            }
                            placeholder="Enter email address"
                            required
                            disabled={manualLoading}
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="manual-phone">WhatsApp Number</Label>
                          <Input
                            id="manual-phone"
                            type="tel"
                            value={manualParticipant.phone}
                            onChange={(e) =>
                              handleManualInputChange("phone", e.target.value)
                            }
                            placeholder="Enter WhatsApp number"
                            disabled={manualLoading}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="manual-transaction">
                            Transaction ID
                          </Label>
                          <Input
                            id="manual-transaction"
                            type="text"
                            value={manualParticipant.transactionId}
                            onChange={(e) =>
                              handleManualInputChange(
                                "transactionId",
                                e.target.value,
                              )
                            }
                            placeholder="Enter UPI transaction ID"
                            disabled={manualLoading}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="manual-screenshot">
                          Screenshot URL
                        </Label>
                        <Input
                          id="manual-screenshot"
                          type="url"
                          value={manualParticipant.screenshot}
                          onChange={(e) =>
                            handleManualInputChange(
                              "screenshot",
                              e.target.value,
                            )
                          }
                          placeholder="Enter screenshot URL (optional)"
                          disabled={manualLoading}
                        />
                      </div>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Only name and email are required. All other fields are
                          optional and can be updated later.
                        </AlertDescription>
                      </Alert>
                    </CardContent>

                    <CardFooter>
                      <Button
                        type="submit"
                        className="w-full gap-2"
                        disabled={
                          manualLoading ||
                          !manualParticipant.name ||
                          !manualParticipant.email
                        }
                      >
                        {manualLoading ? (
                          <>
                            <Spinner className="h-4 w-4" />
                            Adding Participant...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            Add Participant
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </div>

              {/* Manual Entry Tips */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="h-5 w-5" />
                      Manual Entry Benefits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-muted-foreground space-y-2 text-sm">
                      <li>• Add participants one by one for precise control</li>
                      <li>
                        • Perfect for small groups or individual registrations
                      </li>
                      <li>• Instant validation and feedback</li>
                      <li>• Duplicate checking built-in</li>
                      <li>• Can update information later if needed</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Info className="h-5 w-5" />
                      Quick Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-muted-foreground space-y-2 text-sm">
                      <li>• Use proper email format (user@domain.com)</li>
                      <li>• Include country code for phone numbers</li>
                      <li>• Transaction IDs help with payment tracking</li>
                      <li>• Screenshot URLs should be publicly accessible</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
