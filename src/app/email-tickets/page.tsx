"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Checkbox } from "~/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Loader2,
  Mail,
  Send,
  CheckCircle,
  AlertCircle,
  Calendar,
  Users,
  Ticket,
  TestTube,
  Settings,
  AlertTriangle,
  ChevronDown,
  Filter,
  Search,
  MailX,
} from "lucide-react";
import Header from "~/components/Header";
import { toast } from "sonner";
import {
  getParticipants,
  sendTestTicket,
  sendBulkTickets,
} from "~/server/actions";
import { MultiEmailInput } from "~/components/ui/multi-email-input";
import { Skeleton } from "~/components/ui/skeleton";
import { Spinner } from "~/components/ui/spinner";

// Form validation schema
const emailTicketSchema = z.object({
  // Event details (with defaults)
  eventName: z.string().min(1, "Event name is required"),
  eventDescription: z.string().min(1, "Event description is required"),
  eventDate: z.string().min(1, "Event date is required"),
  eventTime: z.string().min(1, "Event time is required"),
  eventLocation: z.string().min(1, "Event location is required"),
  eventAddress: z.string().min(1, "Event address is required"),

  // Optional links
  calendarLink: z
    .string()
    .url("Valid URL required")
    .optional()
    .or(z.literal("")),
  directionsLink: z
    .string()
    .url("Valid URL required")
    .optional()
    .or(z.literal("")),

  // Template settings
  templateId: z.string().min(1, "Template ID is required"),

  // Test emails
  testEmails: z
    .array(z.string().email("Invalid email address"))
    .min(1, "Please add at least one test email address"),

  // Selected participants
  selectedParticipants: z
    .array(z.number())
    .min(1, "Please select at least one participant"),
});

type EmailTicketForm = z.infer<typeof emailTicketSchema>;

type Participant = {
  id: number;
  name: string;
  email: string;
  status: string;
  ticket_sent: boolean | null;
  ticket_sent_at: Date | null;
  attended: boolean | null;
};

type EmailResponse = {
  success: boolean;
  message: string;
  data?: {
    sent: number;
    failed: number;
    details: Array<{
      participantId: number;
      success: boolean;
      message: string;
    }>;
  };
};

const EmailTicketsPage = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<
    Participant[]
  >([]);
  const [loadingParticipants, setLoadingParticipants] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<EmailResponse | null>(null);
  const [selectedAll, setSelectedAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "not-sent">(
    "all",
  );

  const form = useForm<EmailTicketForm>({
    resolver: zodResolver(emailTicketSchema),
    defaultValues: {
      eventName: "Disha 4.0",
      eventDescription:
        "Join us for an inspiring day of expert-led workshops, insightful talks, and professional networking. Gain valuable strategies from industry leaders and connect with fellow aspiring professionals.",
      eventDate: "Thursday, November 6, 2024",
      eventTime: "11:00 AM Onwards",
      eventLocation: "Room No. 3042",
      eventAddress: "AB-12, GLA University, Mathura",
      calendarLink: "https://calendar.app.google/RWC8W6PUxRNQR66t6",
      directionsLink: "https://maps.app.goo.gl/UTqpnnKpiz4ARzCs6",
      templateId: "A-1315b1147d22e02c0a48",
      testEmails: ["sakshamkushwaha12776@gmail.com"],
      selectedParticipants: [],
    },
  });

  // Load participants
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const result = await getParticipants();
        if (result.success) {
          setParticipants(result.participants || []);
          setFilteredParticipants(result.participants || []);
        } else {
          toast.error(result.message || "Failed to load participants");
        }
      } catch (error) {
        console.error("Failed to load participants:", error);
        toast.error("Failed to load participants");
      } finally {
        setLoadingParticipants(false);
      }
    };

    void fetchParticipants();
  }, []);

  // Filter participants based on search and status
  useEffect(() => {
    let filtered = participants;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (participant) =>
          participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          participant.email.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply status filter
    if (statusFilter === "sent") {
      filtered = filtered.filter((participant) => participant.ticket_sent);
    } else if (statusFilter === "not-sent") {
      filtered = filtered.filter((participant) => !participant.ticket_sent);
    }

    setFilteredParticipants(filtered);
  }, [participants, searchQuery, statusFilter]);

  const selectedParticipants = form.watch("selectedParticipants");

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredParticipants.map((p) => p.id);
      form.setValue("selectedParticipants", allIds);
    } else {
      form.setValue("selectedParticipants", []);
    }
    setSelectedAll(checked);
  };

  const handleSelectUnsentOnly = () => {
    const unsentIds = filteredParticipants
      .filter((p) => !p.ticket_sent)
      .map((p) => p.id);
    form.setValue("selectedParticipants", unsentIds);
    setSelectedAll(false);
    toast.success(
      `Selected ${unsentIds.length} participants who haven't received tickets`,
    );
  };

  const handleSelectSentOnly = () => {
    const sentIds = filteredParticipants
      .filter((p) => p.ticket_sent)
      .map((p) => p.id);
    form.setValue("selectedParticipants", sentIds);
    setSelectedAll(false);
    toast.success(
      `Selected ${sentIds.length} participants who have received tickets`,
    );
  };

  const handleInvertSelection = () => {
    const current = form.getValues("selectedParticipants");
    const allIds = filteredParticipants.map((p) => p.id);
    const inverted = allIds.filter((id) => !current.includes(id));
    form.setValue("selectedParticipants", inverted);
    setSelectedAll(false);
    toast.success(
      `Selection inverted - ${inverted.length} participants selected`,
    );
  };

  const handleParticipantSelect = (participantId: number, checked: boolean) => {
    const current = form.getValues("selectedParticipants");
    if (checked) {
      form.setValue("selectedParticipants", [...current, participantId]);
    } else {
      form.setValue(
        "selectedParticipants",
        current.filter((id) => id !== participantId),
      );
      setSelectedAll(false);
    }
  };

  const onSubmit = async (data: EmailTicketForm) => {
    setIsLoading(true);
    setLastResponse(null);

    try {
      const result = await sendBulkTickets(data);
      setLastResponse(result);

      if (result.success) {
        toast.success(
          `Tickets sent successfully! Sent: ${result.data?.sent}, Failed: ${result.data?.failed}`,
        );
        // Refresh participants to update ticket_sent status
        const refreshResult = await getParticipants();
        if (refreshResult.success) {
          setParticipants(refreshResult.participants || []);
        }
        // Clear selection
        form.setValue("selectedParticipants", []);
        setSelectedAll(false);
      } else {
        toast.error(result.message || "Failed to send tickets");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setLastResponse({
        success: false,
        message: errorMessage,
      });
      toast.error("Failed to send tickets");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setIsLoading(true);
    try {
      const values = form.getValues();
      const result = await sendTestTicket({
        ...values,
        participantName: "Test User",
        testEmails: values.testEmails,
      });

      if (result.success) {
        toast.success(
          `Test emails completed! Sent: ${result.data?.sent}, Failed: ${result.data?.failed}`,
        );
      } else {
        toast.error(result.message || "Failed to send test emails");
      }
    } catch (error) {
      toast.error("Failed to send test emails");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCount = selectedParticipants.length;
  const alreadySentCount = participants.filter(
    (p) => selectedParticipants.includes(p.id) && p.ticket_sent,
  ).length;
  const unsentCount = filteredParticipants.filter((p) => !p.ticket_sent).length;
  const sentCount = filteredParticipants.filter((p) => p.ticket_sent).length;

  return (
    <main className="flex min-h-screen flex-col">
      <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Header />

        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <Ticket className="h-6 w-6 sm:h-8 sm:w-8" />
            Send Email Tickets
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Select participants to send personalized event tickets with QR codes
            for attendance verification.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 xl:col-span-2">
            {/* Event Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Event Configuration
                </CardTitle>
                <CardDescription>
                  Configure event details and template settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="eventName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="templateId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>AutoSend Template ID</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="template_abc123xyz"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="eventDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Description</FormLabel>
                          <FormControl>
                            <Textarea className="min-h-20" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="testEmails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Email Addresses</FormLabel>
                          <FormControl>
                            <MultiEmailInput
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Enter email addresses separated by commas (e.g., test1@example.com, test2@example.com)"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="eventDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Date</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="eventTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Time</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="eventLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Venue Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="eventAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Venue Address</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="calendarLink"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Calendar Link (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://calendar.google.com/..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="directionsLink"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Directions Link (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://maps.google.com/..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </Form>
              </CardContent>
            </Card>

            {/* Participants Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Select Participants
                  {selectedCount > 0 && (
                    <Badge variant="default" className="ml-2">
                      {selectedCount} selected
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Choose participants to send email tickets to. Use search,
                  filters, or drag to select multiple participants.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingParticipants ? (
                  <div className="flex items-center justify-center py-8">
                    <Spinner className="h-6 w-6" />
                    <span className="ml-2">Loading participants...</span>
                  </div>
                ) : participants.length === 0 ? (
                  <div className="text-muted-foreground py-8 text-center">
                    No participants found. Please upload participants first.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Search and Filter Controls */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="relative max-w-sm flex-1">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                          placeholder="Search participants..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>

                      <div className="flex gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Filter className="mr-2 h-4 w-4" />
                              Filter
                              <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setStatusFilter("all")}
                            >
                              <span
                                className={
                                  statusFilter === "all" ? "font-medium" : ""
                                }
                              >
                                All Participants ({participants.length})
                              </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setStatusFilter("not-sent")}
                            >
                              <MailX className="mr-2 h-4 w-4" />
                              <span
                                className={
                                  statusFilter === "not-sent"
                                    ? "font-medium"
                                    : ""
                                }
                              >
                                Not Sent ({unsentCount})
                              </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setStatusFilter("sent")}
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              <span
                                className={
                                  statusFilter === "sent" ? "font-medium" : ""
                                }
                              >
                                Already Sent ({sentCount})
                              </span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Bulk Select
                              <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleSelectAll(true)}
                            >
                              Select All Visible (
                              {filteredParticipants.length - 12})
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleSelectUnsentOnly}>
                              <MailX className="mr-2 h-4 w-4" />
                              Select Unsent Only (
                              {
                                filteredParticipants.filter(
                                  (p) => !p.ticket_sent,
                                ).length
                              }
                              )
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleSelectSentOnly}>
                              <Mail className="mr-2 h-4 w-4" />
                              Select Sent Only (
                              {filteredParticipants.filter((p) => p.ticket_sent)
                                .length - 12}
                              )
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleInvertSelection}>
                              Invert Selection
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleSelectAll(false)}
                            >
                              Clear Selection
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {alreadySentCount > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {alreadySentCount} of the selected participants have
                          already been sent tickets. You can still send them
                          again if needed.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Participants Table */}
                    <div className="rounded-lg border">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12 min-w-12">
                                <Checkbox
                                  checked={
                                    filteredParticipants.length > 0 &&
                                    filteredParticipants.every((p) =>
                                      selectedParticipants.includes(p.id),
                                    )
                                  }
                                  onCheckedChange={handleSelectAll}
                                />
                              </TableHead>
                              <TableHead className="min-w-[150px]">
                                Name
                              </TableHead>
                              <TableHead className="hidden min-w-[200px] sm:table-cell">
                                Email
                              </TableHead>
                              <TableHead className="hidden min-w-[100px] md:table-cell">
                                Status
                              </TableHead>
                              <TableHead className="min-w-[120px]">
                                Ticket Status
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredParticipants.map((participant) => {
                              const isSelected = selectedParticipants.includes(
                                participant.id,
                              );

                              return (
                                <TableRow
                                  key={participant.id}
                                  className={isSelected ? "bg-muted/50" : ""}
                                >
                                  <TableCell>
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) =>
                                        handleParticipantSelect(
                                          participant.id,
                                          checked as boolean,
                                        )
                                      }
                                    />
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    <div className="space-y-1">
                                      <div>{participant.name}</div>
                                      <div className="text-muted-foreground text-xs sm:hidden">
                                        {participant.email}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground hidden text-sm sm:table-cell">
                                    {participant.email}
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell">
                                    <Badge
                                      variant={
                                        participant.status === "verified"
                                          ? "default"
                                          : "secondary"
                                      }
                                    >
                                      {participant.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-2">
                                        {participant.ticket_sent ? (
                                          <Badge
                                            variant="outline"
                                            className="text-green-600"
                                          >
                                            <Mail className="mr-1 h-3 w-3" />
                                            <span className="hidden sm:inline">
                                              Sent
                                            </span>
                                            <span className="sm:hidden">✓</span>
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline">
                                            <span className="hidden sm:inline">
                                              Not Sent
                                            </span>
                                            <span className="sm:hidden">✗</span>
                                          </Badge>
                                        )}
                                      </div>
                                      {participant.ticket_sent_at && (
                                        <span className="text-muted-foreground text-xs">
                                          {new Date(
                                            participant.ticket_sent_at,
                                          ).toLocaleDateString()}
                                        </span>
                                      )}
                                      <div className="md:hidden">
                                        <Badge
                                          variant={
                                            participant.status === "verified"
                                              ? "default"
                                              : "secondary"
                                          }
                                          className="text-xs"
                                        >
                                          {participant.status}
                                        </Badge>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Selection Info */}
                    <div className="text-muted-foreground flex items-center justify-between text-sm">
                      <div>
                        Showing {filteredParticipants.length} of{" "}
                        {participants.length} participants
                        {searchQuery && ` matching "${searchQuery}"`}
                      </div>
                      <div className="flex items-center gap-4">
                        <span>{selectedCount} selected</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                type="button"
                onClick={handleTestEmail}
                disabled={isLoading || form.watch("testEmails").length === 0}
                variant="outline"
                className="flex-1"
              >
                {isLoading ? (
                  <Spinner className="mr-2 h-4 w-4" />
                ) : (
                  <TestTube className="mr-2 h-4 w-4" />
                )}
                <span className="hidden sm:inline">Send Test Emails</span>
                <span className="sm:hidden">Test</span> (
                {form.watch("testEmails").length})
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={isLoading || selectedCount === 0}
                className="flex-1"
              >
                {isLoading ? (
                  <Spinner className="mr-2 h-4 w-4" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                <span className="hidden sm:inline">Send Tickets</span>
                <span className="sm:hidden">Send</span> ({selectedCount})
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-4 w-4" />
                  Last Operation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lastResponse ? (
                  <div className="space-y-2">
                    <Alert
                      variant={lastResponse.success ? "default" : "destructive"}
                    >
                      {lastResponse.success ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <AlertDescription>
                        {lastResponse.message}
                      </AlertDescription>
                    </Alert>
                    {lastResponse.data && (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded bg-green-50 p-2 text-center">
                          <div className="text-lg font-medium text-green-800">
                            {lastResponse.data.sent}
                          </div>
                          <div className="text-xs text-green-600">Sent</div>
                        </div>
                        <div className="rounded bg-red-50 p-2 text-center">
                          <div className="text-lg font-medium text-red-800">
                            {lastResponse.data.failed}
                          </div>
                          <div className="text-xs text-red-600">Failed</div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground py-4 text-center text-sm">
                    No operations yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Total Participants:
                  </span>
                  <span className="font-medium">{participants.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Filtered/Visible:
                  </span>
                  <span className="font-medium">
                    {filteredParticipants.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Selected:</span>
                  <span className="font-medium">{selectedCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Already Sent:</span>
                  <span className="font-medium text-green-600">
                    {sentCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Not Sent:</span>
                  <span className="font-medium text-orange-600">
                    {unsentCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Recipients:</span>
                  <span className="font-medium">
                    {selectedCount - alreadySentCount}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tips & Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground space-y-3 text-sm">
                  <div className="flex gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    <span className="leading-relaxed">
                      <strong>Bulk actions:</strong> Use the "Bulk Select" menu
                      to quickly select unsent participants
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    <span className="leading-relaxed">
                      <strong>Search & filter:</strong> Find participants by
                      name or email, filter by ticket status
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    <span className="leading-relaxed">
                      Add multiple test emails separated by commas or press
                      Enter
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    <span className="leading-relaxed">
                      QR codes are automatically generated for each participant
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    <span className="leading-relaxed">
                      You can resend tickets to participants if needed
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};

export default EmailTicketsPage;
