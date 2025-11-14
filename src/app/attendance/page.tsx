"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "~/components/ui/select";
import { ResponsiveDialog } from "~/components/ui/responsive-dialog";
import { Alert, AlertDescription } from "~/components/ui/alert";
import {
  Loader2,
  QrCode,
  CheckCircle,
  XCircle,
  ImageIcon,
  Camera,
  Settings,
  Users,
} from "lucide-react";
import { Scanner, useDevices } from "@yudiel/react-qr-scanner";
import { Badge } from "~/components/ui/badge";
import { verifyAndMarkAttendance, updateUserStatus } from "~/server/actions";
import Header from "~/components/Header";
import { Skeleton } from "~/components/ui/skeleton";
import { Spinner } from "~/components/ui/spinner";

// Type for parsed QR code data
type QRCodeData = {
  name: string;
  email: string;
  hash: string;
};

// Type for attendance response - updated for single-day system
type AttendanceResponse = {
  success: boolean;
  verified: boolean;
  message: string;
  user?: {
    name: string;
    email: string;
    status: string;
    screenshot: string;
    attended: boolean;
  };
};

const ScannerPage = () => {
  // Official device selection pattern from @yudiel/react-qr-scanner
  const devices = useDevices();
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [attendanceResponse, setAttendanceResponse] =
    useState<AttendanceResponse | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleScan = async (detectedCodes: any[]) => {
    if (detectedCodes.length === 0 || isVerifying) return;

    const firstCode = detectedCodes[0];
    const decodedText = firstCode?.rawValue;

    if (!decodedText) return;

    // Store raw scan result
    setScanResult(decodedText);

    // Try to parse as JSON
    setIsVerifying(true);
    try {
      const parsedData = JSON.parse(decodedText) as QRCodeData;

      // Make sure we have the required fields
      if (!parsedData.name || !parsedData.email || !parsedData.hash) {
        throw new Error("Invalid QR code format: missing required fields");
      }

      // Call server action to verify and mark attendance
      const response = await verifyAndMarkAttendance(
        parsedData.name,
        parsedData.email,
        parsedData.hash,
      );

      setAttendanceResponse(response);
    } catch (err) {
      console.error("QR code processing error:", err);
      setAttendanceResponse({
        success: false,
        verified: false,
        message: `Error processing QR code: ${err instanceof Error ? err.message : "Invalid format"}`,
      });
    } finally {
      setIsVerifying(false);
      setShowResult(true);
    }
  };

  const handleError = (error: unknown) => {
    console.error("Scanner error:", error);
    setError(
      `Scanner error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  };

  const scanAnotherCode = () => {
    setScanResult(null);
    setAttendanceResponse(null);
    setShowResult(false);
  };

  return (
    <main className="flex min-h-screen flex-col">
      <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Header />

        {/* Page Header - matching dashboard style */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            QR Code Scanner
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Scan attendee QR codes to mark attendance for your event. Simply
            select a camera and scan participant codes to verify and record
            attendance.
          </p>
        </div>

        {/* Scanner Interface */}
        <div className="grid gap-6 xl:grid-cols-3">
          {/* Main Scanner Card */}
          <div className="xl:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Event Scanner
                </CardTitle>
                <CardDescription>
                  Select a camera and scan QR codes for attendance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="camera-select"
                      className="text-sm font-medium"
                    >
                      Select Camera Device
                    </Label>
                    <Select
                      value={selectedDevice || undefined}
                      onValueChange={setSelectedDevice}
                    >
                      <SelectTrigger id="camera-select" className="w-full">
                        <SelectValue placeholder="Select a camera" />
                      </SelectTrigger>
                      <SelectContent>
                        {devices.length > 0 ? (
                          devices.map((device) => {
                            // Ensure we have a valid deviceId
                            const deviceId =
                              device.deviceId ||
                              `device-${Math.random().toString(36).substr(2, 9)}`;
                            return (
                              <SelectItem key={deviceId} value={deviceId}>
                                <div className="flex items-center gap-2">
                                  <Camera className="h-4 w-4" />
                                  <span className="truncate">
                                    {device.label ||
                                      `Camera ${deviceId.slice(0, 8)}...`}
                                  </span>
                                </div>
                              </SelectItem>
                            );
                          })
                        ) : (
                          <SelectItem value="no-camera" disabled>
                            No cameras detected
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {devices.length === 0 && (
                    <div className="flex h-[200px] items-center justify-center">
                      <div className="space-y-4 text-center">
                        <Spinner className="mx-auto h-8 w-8" />
                        <div>
                          <p className="text-sm font-medium">
                            Loading cameras...
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Please grant camera permissions if prompted
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {selectedDevice && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center">
                        <Badge variant="default" className="gap-2">
                          <CheckCircle className="h-3 w-3" />
                          Scanning Active
                        </Badge>
                      </div>

                      <div className="border-muted-foreground/25 bg-muted/20 w-full overflow-hidden rounded-lg border-2 border-dashed">
                        <Scanner
                          onScan={handleScan}
                          onError={handleError}
                          constraints={{
                            deviceId: selectedDevice,
                            facingMode: "environment",
                            aspectRatio: 1,
                          }}
                          formats={["qr_code"]}
                          scanDelay={2000}
                          components={{
                            finder: true,
                          }}
                          sound={true}
                        />
                      </div>

                      <Alert>
                        <QrCode className="h-4 w-4" />
                        <AlertDescription>
                          Point your camera at a participant's QR code to scan
                          and mark attendance. The scanner will automatically
                          detect QR codes.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar with Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  Scanner Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Camera</span>
                  <Badge variant={selectedDevice ? "default" : "secondary"}>
                    {selectedDevice ? "Connected" : "Not Selected"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Scanner</span>
                  <Badge variant={selectedDevice ? "default" : "outline"}>
                    {selectedDevice ? "Active" : "Waiting"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Mode</span>
                  <Badge variant="outline">Event Attendance</Badge>
                </div>
                {devices.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Available Cameras
                    </span>
                    <Badge variant="outline">{devices.length}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Scanner Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground space-y-3 text-sm">
                  <div className="flex gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    <span className="leading-relaxed">
                      Ensure good lighting for optimal scanning
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    <span className="leading-relaxed">
                      Hold the QR code steady in the camera view
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    <span className="leading-relaxed">
                      Scanner will beep and pause automatically on detection
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    <span className="leading-relaxed">
                      Works best with rear camera for mobile devices
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ResponsiveDialog
        open={showResult}
        onOpenChange={(open: boolean) => {
          if (!open) scanAnotherCode();
          setShowResult(open);
        }}
        title={
          attendanceResponse?.success
            ? "Attendance Marked"
            : attendanceResponse?.verified
              ? "User Not Registered"
              : "Verification Failed"
        }
        description={attendanceResponse?.message ?? "QR code scan results"}
        footer={
          <Button onClick={scanAnotherCode} className="w-full" size="default">
            <QrCode className="mr-2 h-4 w-4" />
            Scan Another Code
          </Button>
        }
      >
        <div className="space-y-4">
          {attendanceResponse?.user && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  Participant Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">Name</p>
                    <p className="truncate font-medium">
                      {attendanceResponse.user.name}
                    </p>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-muted-foreground text-xs">Email</p>
                    <p className="text-xs font-medium break-all">
                      {attendanceResponse.user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-muted-foreground text-sm">Status</span>
                  <Badge
                    variant={
                      attendanceResponse.user.status === "registered"
                        ? "default"
                        : "secondary"
                    }
                    className="hover:bg-primary/80 cursor-pointer text-xs"
                    onClick={async () => {
                      if (attendanceResponse.user?.status === "registered") {
                        const result = await updateUserStatus(
                          attendanceResponse.user.name,
                          attendanceResponse.user.email,
                        );

                        if (result.success) {
                          setAttendanceResponse({
                            ...attendanceResponse,
                            user: {
                              ...attendanceResponse.user,
                              status: "verified",
                            },
                          });
                        }
                      } else if (
                        attendanceResponse.user?.status === "verified"
                      ) {
                        // Allow toggling back to registered
                        setAttendanceResponse({
                          ...attendanceResponse,
                          user: {
                            ...attendanceResponse.user,
                            status: "registered",
                          },
                        });
                      }
                    }}
                  >
                    {attendanceResponse.user.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Attendance
                  </span>
                  <Badge
                    variant={
                      attendanceResponse.user.attended ? "default" : "outline"
                    }
                    className="text-xs"
                  >
                    {attendanceResponse.user.attended
                      ? "Attended"
                      : "Not Attended"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {attendanceResponse?.user?.screenshot && (
            <div className="text-center">
              <Button variant="outline" size="sm" asChild className="gap-2">
                <a
                  href={attendanceResponse.user.screenshot}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ImageIcon className="h-3 w-3" />
                  View Payment Screenshot
                </a>
              </Button>
            </div>
          )}
        </div>
      </ResponsiveDialog>
    </main>
  );
};

export default ScannerPage;
