/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
"use server";
import { db } from "./db";

import {
  attendees,
  events,
  teams,
  teamMembers,
  teamInvites,
  tasks,
} from "./db/schema";
import { and, eq, sql, asc, desc, inArray } from "drizzle-orm";
import { z } from "zod";
import Papa from "papaparse";
import * as crypto from "crypto";
import { env } from "~/env";
import QRCode from "qrcode";
import { toTitleCase } from "~/lib/utils";
// Define a constant for the secret key used in hash verification
const SECRET = "gfgscglau_ki_jai_wu_hu_hehe";

// AutoSend base URL
const AUTOSEND_BASE_URL = "https://api.autosend.com/v1";

// Verify and mark attendance for a user
export async function verifyAndMarkAttendance(
  name: string,
  email: string,
  hash: string
) {
  try {
    // Recreate the hash to verify authenticity
    const hashString = `${name}|${email}|${SECRET}`;
    const calculatedHash = crypto
      .createHash("sha256")
      .update(hashString)
      .digest("hex");

    // If hash doesn't match, return verification failed
    if (calculatedHash !== hash) {
      return {
        success: false,
        verified: false,
        message: "Invalid QR code - hash verification failed",
      };
    }

    // Find the attendee
    const attendee = await db.query.attendees.findFirst({
      where: and(eq(attendees.name, name), eq(attendees.email, email)),
    });

    // If attendee not found, return not registered
    if (!attendee) {
      return {
        success: false,
        verified: true,
        message: "Attendee not registered in the system",
      };
    }

    // Check if already attended
    if (attendee.attended) {
      return {
        success: false,
        verified: true,
        message: "Attendance already marked for this attendee",
        user: {
          name: attendee.name,
          email: attendee.email,
          status: attendee.status,
          screenshot: attendee.screenshot,
          attended: attendee.attended ?? false,
        },
      };
    }

    // Update the attendance
    await db
      .update(attendees)
      .set({
        attended: true,
      })
      .where(and(eq(attendees.name, name), eq(attendees.email, email)));

    return {
      success: true,
      verified: true,
      message: "Attendance marked successfully",
      user: {
        name: attendee.name,
        email: attendee.email,
        status: attendee.status,
        screenshot: attendee.screenshot,
        attended: true,
      },
    };
  } catch (error) {
    console.error("Error marking attendance:", error);
    return {
      success: false,
      verified: false,
      message: `Error marking attendance: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// Update attendee status from "registered" to "verified"
export async function updateAttendeeStatus(name: string, email: string) {
  try {
    // Find the attendee
    const attendee = await db.query.attendees.findFirst({
      where: and(eq(attendees.name, name), eq(attendees.email, email)),
    });

    // If attendee not found, return error
    if (!attendee) {
      return {
        success: false,
        message: "Attendee not found",
      };
    }

    // Only update if current status is "registered"
    if (attendee.status !== "registered") {
      return {
        success: false,
        message: `Attendee status is already ${attendee.status}`,
      };
    }

    // Update the attendee status to "verified"
    await db
      .update(attendees)
      .set({
        status: "verified",
      })
      .where(and(eq(attendees.name, name), eq(attendees.email, email)));

    return {
      success: true,
      message: "Attendee status updated to verified",
      user: {
        ...attendee,
        status: "verified",
      },
    };
  } catch (error) {
    console.error("Error updating attendee status:", error);
    return {
      success: false,
      message: `Error updating status: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// Define the schema for CSV participant data
const participantSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  transactionId: z.string().optional(),
  screenshot: z.string().optional(),
});

// Manual participant creation schema
const manualParticipantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  transactionId: z.string().optional(),
  screenshot: z.string().optional(),
  status: z.string().default("registered"),
});

// Create a single participant manually
export async function createManualParticipant(formData: FormData) {
  try {
    const validatedFields = manualParticipantSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      transactionId: formData.get("transactionId"),
      screenshot: formData.get("screenshot"),
      status: formData.get("status"),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        message:
          "Validation failed: " +
          validatedFields.error.issues.map((e) => e.message).join(", "),
      };
    }

    const { name, email, phone, transactionId, screenshot, status } =
      validatedFields.data;

    // Check if attendee already exists
    const existingAttendee = await db.query.attendees.findFirst({
      where: and(eq(attendees.name, name), eq(attendees.email, email)),
    });

    if (existingAttendee) {
      return {
        success: false,
        message: "Participant with this name and email already exists",
      };
    }

    // Create new attendee
    await db.insert(attendees).values({
      name,
      email,
      phone: phone || "",
      transaction_id: transactionId || "",
      status,
      screenshot: screenshot || "",
    });

    return {
      success: true,
      message: "Participant added successfully",
    };
  } catch (error) {
    console.error("Error creating manual participant:", error);
    return {
      success: false,
      message: `Error creating participant: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// Process CSV file and insert new participants
export async function processCsvUpload(csvContent: string) {
  try {
    // Parse CSV content using papaparse
    const parseResult = Papa.parse<Record<string, string>>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transform: (value: string) => value.trim(),
    });

    if (parseResult.errors && parseResult.errors.length > 0) {
      const parseErrors = parseResult.errors
        .map((error: Papa.ParseError) => `Row ${error.row}: ${error.message}`)
        .join("; ");
      return {
        success: false,
        message: `CSV parsing errors: ${parseErrors}`,
      };
    }

    const records = parseResult.data;

    if (!records || records.length === 0) {
      return { success: false, message: "CSV file contains no data" };
    }

    let addedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: Array<{ row: number; error: string }> = [];

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      // Skip empty records
      if (!record) continue;

      try {
        // Extract and validate participant data
        const rawFullName = record["Full Name"]?.trim();
        const validatedData = participantSchema.parse({
          fullName: rawFullName ? toTitleCase(rawFullName) : "",
          email: record["Email Address"]?.trim(),
          phone: (
            record["WhatsApp Number"] || record["Whatsapp Number"]
          )?.trim(),
          transactionId: record["UPI ID"]?.trim() ?? "",
          screenshot: record["Screenshot of transaction"]?.trim() ?? "",
        });

        // Check if this participant already exists (by name and email)
        const existingParticipant = await db.query.attendees.findFirst({
          where: and(
            eq(attendees.name, validatedData.fullName),
            eq(attendees.email, validatedData.email)
          ),
        });

        // If participant doesn't exist, add them
        if (!existingParticipant) {
          await db.insert(attendees).values({
            name: validatedData.fullName,
            email: validatedData.email,
            phone: validatedData.phone,
            transaction_id: validatedData.transactionId ?? "",
            screenshot: validatedData.screenshot ?? "",
            status: "registered", // Default status
            attended: false,
          });
          addedCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        errorCount++;
        if (error instanceof z.ZodError) {
          // Format and collect zod validation errors
          errors.push({
            row: i + 2, // +2 because CSV header is row 1, and array is 0-indexed
            error: error.issues
              .map((e: any) => `${e.path}: ${e.message}`)
              .join(", "),
          });
        } else {
          errors.push({
            row: i + 2,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    return {
      success: true,
      addedCount,
      skippedCount,
      errorCount,
      errors: errorCount > 0 ? errors : undefined,
      message: `CSV processed successfully! Added: ${addedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`,
    };
  } catch (error) {
    console.error("Error processing CSV:", error);
    return {
      success: false,
      message: `Error processing CSV: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// Generate QR code as base64 image
async function generateQRCodeImage(
  name: string,
  email: string
): Promise<string> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://stampede.lirena.in/";
  const encodedName = encodeURIComponent(name);
  const encodedEmail = encodeURIComponent(email);

  return `${baseUrl}/api/qr?name=${encodedName}&email=${encodedEmail}`;
}
// Generate QR code hash (same as attendance system)
function generateQRCodeHash(name: string, email: string): string {
  const hashString = `${name}|${email}|${SECRET}`;
  return crypto.createHash("sha256").update(hashString).digest("hex");
}

// Generate unique ticket ID
function generateTicketId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `TKT-${timestamp}-${random}`.toUpperCase();
}

// Get current date for footer
function getCurrentDate(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Get current year for copyright
function getCurrentYear(): string {
  return new Date().getFullYear().toString();
}

// Get all participants with ticket status
export async function getParticipants() {
  try {
    const allParticipants = await db.query.attendees.findMany({
      orderBy: [asc(attendees.name)],
      columns: {
        id: true,
        name: true,
        email: true,
        status: true,
        ticket_sent: true,
        ticket_sent_at: true,
        attended: true,
      },
    });

    return {
      success: true,
      participants: allParticipants,
    };
  } catch (error) {
    console.error("Error fetching participants:", error);
    return {
      success: false,
      message: "Failed to fetch participants",
      participants: [],
    };
  }
}

// Send test email ticket
export async function sendTestTicket(data: {
  eventName: string;
  eventDescription: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventAddress: string;
  calendarLink?: string;
  directionsLink?: string;
  templateId: string;
  participantName: string;
  testEmails: string[]; // Changed from participantEmail to testEmails array
}) {
  try {
    // Check if API key is configured
    if (!env.AUTOSEND_API_KEY) {
      return {
        success: false,
        message: "AutoSend API key not configured",
      };
    }

    if (!data.testEmails || data.testEmails.length === 0) {
      return {
        success: false,
        message: "No test email addresses provided",
      };
    }

    // Generate QR code hash and ticket ID for test (using first email for QR generation)
    const qrCodeHash = generateQRCodeHash(
      data.participantName,
      data.testEmails[0]!
    );
    const ticketId = generateTicketId();
    const qrCodeImage = await generateQRCodeImage(
      data.participantName,
      data.testEmails[0]!
    );

    // Prepare dynamic data for template
    const dynamicData = {
      participantName: data.participantName,
      participantEmail: data.testEmails[0], // Use first email for display
      eventName: data.eventName,
      eventDescription: data.eventDescription,
      eventDate: data.eventDate,
      eventTime: data.eventTime,
      eventLocation: data.eventLocation,
      eventAddress: data.eventAddress,
      calendarLink: data.calendarLink || "#",
      directionsLink: data.directionsLink || "#",
      qrCodeHash: qrCodeHash,
      qrCodeImage: qrCodeImage, // Add base64 image
      ticketId: ticketId,
      generateDate: getCurrentDate(),
      currentYear: getCurrentYear(),
    };

    let sentCount = 0;
    let failedCount = 0;
    const details: Array<{
      email: string;
      success: boolean;
      message: string;
      emailId?: string;
    }> = [];

    // Send test emails to all provided addresses
    for (const testEmail of data.testEmails) {
      try {
        // Prepare email payload for AutoSend API
        const emailPayload = {
          to: {
            email: testEmail,
            name: data.participantName,
          },
          from: {
            email: "geeksforgeekscambusbody@lirena.in", // Replace with your verified domain
            name: "Geeks For Geeks Campus Body GLAU",
          },
          templateId: data.templateId,
          dynamicData: dynamicData,
          categories: ["event-ticket", "test"],
          test: true,
        };

        // Send email via AutoSend API
        const autosendResponse = await fetch(
          `${AUTOSEND_BASE_URL}/mails/send`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.AUTOSEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(emailPayload),
          }
        );

        const autosendResult = await autosendResponse.json();

        if (autosendResponse.ok) {
          sentCount++;
          details.push({
            email: testEmail,
            success: true,
            message: "Test email sent successfully",
            emailId: autosendResult.data?.emailId,
          });
        } else {
          failedCount++;
          details.push({
            email: testEmail,
            success: false,
            message: autosendResult.message || "Failed to send test email",
          });
        }
      } catch (emailError) {
        failedCount++;
        details.push({
          email: testEmail,
          success: false,
          message:
            emailError instanceof Error ? emailError.message : "Unknown error",
        });
      }
    }

    return {
      success: sentCount > 0,
      message: `Test emails completed. Sent: ${sentCount}, Failed: ${failedCount}`,
      data: {
        sent: sentCount,
        failed: failedCount,
        details: details,
        ticketId: ticketId,
        qrCodeHash: qrCodeHash,
      },
    };
  } catch (error) {
    console.error("Send test ticket error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    };
  }
}

// Update participant attendance status
export async function updateParticipantAttendance(
  id: number,
  attended: boolean
) {
  try {
    // Update the attendance status
    await db
      .update(attendees)
      .set({
        attended: attended,
      })
      .where(eq(attendees.id, id));

    return {
      success: true,
      message: `Attendance status updated to ${attended ? "attended" : "not attended"}`,
    };
  } catch (error) {
    console.error("Error updating attendance:", error);
    return {
      success: false,
      message: `Error updating attendance: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// Update participant status
export async function updateParticipantStatus(id: number, status: string) {
  try {
    // Update the participant status
    await db
      .update(attendees)
      .set({
        status: status,
      })
      .where(eq(attendees.id, id));

    return {
      success: true,
      message: `Status updated to ${status}`,
    };
  } catch (error) {
    console.error("Error updating status:", error);
    return {
      success: false,
      message: `Error updating status: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// Remove participant
export async function removeParticipant(id: number) {
  try {
    // Delete the participant from the database
    await db.delete(attendees).where(eq(attendees.id, id));

    return {
      success: true,
      message: "Participant removed successfully",
    };
  } catch (error) {
    console.error("Error removing participant:", error);
    return {
      success: false,
      message: `Error removing participant: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// Update participant details
export async function updateParticipantDetails(
  id: number,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    transaction_id?: string;
    screenshot?: string;
    status?: string;
    attended?: boolean;
  }
) {
  try {
    // Filter out undefined values
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        message: "No data provided for update",
      };
    }

    // Update the participant details
    await db.update(attendees).set(updateData).where(eq(attendees.id, id));

    return {
      success: true,
      message: "Participant details updated successfully",
    };
  } catch (error) {
    console.error("Error updating participant details:", error);
    return {
      success: false,
      message: `Error updating participant details: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// Send bulk email tickets
export async function sendBulkTickets(data: {
  eventName: string;
  eventDescription: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventAddress: string;
  calendarLink?: string;
  directionsLink?: string;
  templateId: string;
  selectedParticipants: number[];
}) {
  try {
    // Check if API key is configured
    if (!env.AUTOSEND_API_KEY) {
      return {
        success: false,
        message: "AutoSend API key not configured",
      };
    }

    if (!data.selectedParticipants.length) {
      return {
        success: false,
        message: "No participants selected",
      };
    }

    // Fetch selected participants
    const participants = await db.query.attendees.findMany({
      where: inArray(attendees.id, data.selectedParticipants),
      columns: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (participants.length === 0) {
      return {
        success: false,
        message: "No valid participants found",
      };
    }

    let sentCount = 0;
    let failedCount = 0;
    const details: Array<{
      participantId: number;
      success: boolean;
      message: string;
    }> = [];

    // Send emails to each participant
    for (const participant of participants) {
      try {
        // Generate QR code hash and ticket ID
        const qrCodeHash = generateQRCodeHash(
          participant.name,
          participant.email
        );
        const ticketId = generateTicketId();
        const qrCodeImage = await generateQRCodeImage(
          participant.name,
          participant.email
        );

        // Prepare dynamic data for template
        const dynamicData = {
          participantName: participant.name,
          participantEmail: participant.email,
          eventName: data.eventName,
          eventDescription: data.eventDescription,
          eventDate: data.eventDate,
          eventTime: data.eventTime,
          eventLocation: data.eventLocation,
          eventAddress: data.eventAddress,
          calendarLink: data.calendarLink || "#",
          directionsLink: data.directionsLink || "#",
          qrCodeHash: qrCodeHash,
          qrCodeImage: qrCodeImage, // Add base64 image
          ticketId: ticketId,
          generateDate: getCurrentDate(),
          currentYear: getCurrentYear(),
        };

        // Prepare email payload for AutoSend API
        const emailPayload = {
          to: {
            email: participant.email,
            name: participant.name,
          },
          from: {
            email: "geeksforgeekscambusbody@lirena.in", // Replace with your verified domain
            name: "Geeks For Geeks Campus Body GLAU",
          },
          templateId: data.templateId,
          dynamicData: dynamicData,
          categories: ["event-ticket"],
        };

        // Send email via AutoSend API
        const autosendResponse = await fetch(
          `${AUTOSEND_BASE_URL}/mails/send`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.AUTOSEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(emailPayload),
          }
        );

        const autosendResult = await autosendResponse.json();

        if (autosendResponse.ok) {
          // Update participant record to mark ticket as sent
          await db
            .update(attendees)
            .set({
              ticket_sent: true,
              ticket_sent_at: new Date(),
            })
            .where(eq(attendees.id, participant.id));

          sentCount++;
          details.push({
            participantId: participant.id,
            success: true,
            message: "Ticket sent successfully",
          });
        } else {
          failedCount++;
          details.push({
            participantId: participant.id,
            success: false,
            message: autosendResult.message || "Failed to send email",
          });
        }
      } catch (emailError) {
        failedCount++;
        details.push({
          participantId: participant.id,
          success: false,
          message:
            emailError instanceof Error ? emailError.message : "Unknown error",
        });
      }
    }

    return {
      success: true,
      message: `Bulk email operation completed. Sent: ${sentCount}, Failed: ${failedCount}`,
      data: {
        sent: sentCount,
        failed: failedCount,
        details: details,
      },
    };
  } catch (error) {
    console.error("Send bulk tickets error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    };
  }
}

// Event management actions
const createEventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  description: z.string().optional(),
  address: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  maxCapacity: z.number().optional(),
});

export async function createEvent(formData: FormData, userId: string) {
  try {
    const validatedFields = createEventSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description"),
      address: formData.get("address"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      maxCapacity: formData.get("maxCapacity")
        ? Number(formData.get("maxCapacity"))
        : undefined,
    });

    if (!validatedFields.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { name, description, address, startDate, endDate, maxCapacity } =
      validatedFields.data;

    const result = await db
      .insert(events)
      .values({
        name,
        description,
        address,
        start_date: startDate ? new Date(startDate) : null,
        end_date: endDate ? new Date(endDate) : null,
        max_capacity: maxCapacity,
        created_by: userId,
      })
      .returning();

    return {
      success: true,
      message: "Event created successfully",
      event: result[0],
    };
  } catch (error) {
    console.error("Create event error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create event",
    };
  }
}

// Team management actions
const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  description: z.string().optional(),
  eventId: z.number(),
});

export async function createTeam(formData: FormData, userId: string) {
  try {
    const validatedFields = createTeamSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description"),
      eventId: Number(formData.get("eventId")),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { name, description, eventId } = validatedFields.data;

    const result = await db
      .insert(teams)
      .values({
        name,
        description,
        event_id: eventId,
        created_by: userId,
      })
      .returning();

    // Add creator as admin to the team
    await db.insert(teamMembers).values({
      team_id: result[0]!.id,
      user_id: userId,
      role: "admin",
      status: "active",
    });

    return {
      success: true,
      message: "Team created successfully",
      team: result[0],
    };
  } catch (error) {
    console.error("Create team error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create team",
    };
  }
}

// Task management actions
const createTaskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  status: z
    .enum(["done", "in-progress", "backlog", "in-review", "cancelled"])
    .default("backlog"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  eventId: z.number(),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
});

export async function createTask(formData: FormData, userId: string) {
  try {
    const validatedFields = createTaskSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      status: formData.get("status"),
      priority: formData.get("priority"),
      eventId: Number(formData.get("eventId")),
      assignedTo: formData.get("assignedTo") || undefined,
      dueDate: formData.get("dueDate") || undefined,
    });

    if (!validatedFields.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const {
      title,
      description,
      status,
      priority,
      eventId,
      assignedTo,
      dueDate,
    } = validatedFields.data;

    const result = await db
      .insert(tasks)
      .values({
        title,
        description,
        status,
        priority,
        event_id: eventId,
        assigned_to: assignedTo,
        created_by: userId,
        due_date: dueDate ? new Date(dueDate) : null,
      })
      .returning();

    return {
      success: true,
      message: "Task created successfully",
      task: result[0],
    };
  } catch (error) {
    console.error("Create task error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create task",
    };
  }
}

export async function updateTaskStatus(
  taskId: number,
  status: string,
  userId: string
) {
  try {
    const result = await db
      .update(tasks)
      .set({
        status,
        completed_at: status === "done" ? new Date() : null,
        updated_at: new Date(),
      })
      .where(eq(tasks.id, taskId))
      .returning();

    return {
      success: true,
      message: "Task status updated successfully",
      task: result[0],
    };
  } catch (error) {
    console.error("Update task status error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update task status",
    };
  }
}

// Team invite actions
function generateInviteCode(): string {
  const randomString = Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `INV-${randomString}-${timestamp}`;
}

const createTeamInviteSchema = z.object({
  teamId: z.number(),
  eventId: z.number(),
  role: z.enum(["admin", "moderator"]).default("moderator"),
  permissions: z.string().default("{}"),
  usesLimit: z.number().optional(),
  expiresInDays: z.number().default(7),
});

export async function createTeamInvite(formData: FormData, userId: string) {
  try {
    const validatedFields = createTeamInviteSchema.safeParse({
      teamId: Number(formData.get("teamId")),
      eventId: Number(formData.get("eventId")),
      role: formData.get("role"),
      permissions: formData.get("permissions"),
      usesLimit: formData.get("usesLimit")
        ? Number(formData.get("usesLimit"))
        : undefined,
      expiresInDays: formData.get("expiresInDays")
        ? Number(formData.get("expiresInDays"))
        : 7,
    });

    if (!validatedFields.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { teamId, eventId, role, permissions, usesLimit, expiresInDays } =
      validatedFields.data;

    // Check if user has permission to create invite for this team (must be admin or team creator)
    const teamMember = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.team_id, teamId),
        eq(teamMembers.user_id, userId)
      ),
    });

    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
    });

    if (!team) {
      return {
        success: false,
        message: "Team not found",
      };
    }

    // Check permissions - user must be admin or team creator
    if (
      team.created_by !== userId &&
      (!teamMember || teamMember.role !== "admin")
    ) {
      return {
        success: false,
        message: "You don't have permission to create invites for this team",
      };
    }

    const inviteCode = generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const result = await db
      .insert(teamInvites)
      .values({
        invite_code: inviteCode,
        team_id: teamId,
        event_id: eventId,
        role,
        permissions,
        created_by: userId,
        uses_limit: usesLimit,
        expires_at: expiresAt,
      })
      .returning();

    return {
      success: true,
      message: "Team invite created successfully",
      invite: result[0],
    };
  } catch (error) {
    console.error("Create team invite error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create team invite",
    };
  }
}

export async function joinTeamWithInvite(inviteCode: string, userId: string) {
  try {
    // Find the invite
    const invite = await db.query.teamInvites.findFirst({
      where: and(
        eq(teamInvites.invite_code, inviteCode),
        eq(teamInvites.is_active, true)
      ),
      with: {
        team: true,
        event: true,
      },
    });

    if (!invite) {
      return {
        success: false,
        message: "Invalid or expired invite code",
      };
    }

    // Check if invite has expired
    if (invite.expires_at && invite.expires_at < new Date()) {
      return {
        success: false,
        message: "This invite has expired",
      };
    }

    // Check if invite has reached usage limit
    if (invite.uses_limit && (invite.used_count ?? 0) >= invite.uses_limit) {
      return {
        success: false,
        message: "This invite has reached its usage limit",
      };
    }

    // Check if user is already a member of this team
    const existingMember = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.team_id, invite.team_id),
        eq(teamMembers.user_id, userId)
      ),
    });

    if (existingMember) {
      return {
        success: false,
        message: "You are already a member of this team",
      };
    }

    // Add user to team
    const newMember = await db
      .insert(teamMembers)
      .values({
        team_id: invite.team_id,
        user_id: userId,
        role: invite.role,
        permissions: invite.permissions,
        invited_by: invite.created_by,
        status: "active",
      })
      .returning();

    // Increment invite usage count
    await db
      .update(teamInvites)
      .set({
        used_count: (invite.used_count ?? 0) + 1,
      })
      .where(eq(teamInvites.id, invite.id));

    return {
      success: true,
      message: `Successfully joined ${invite.team.name}!`,
      member: newMember[0],
      team: invite.team,
      event: invite.event,
    };
  } catch (error) {
    console.error("Join team with invite error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to join team",
    };
  }
}
