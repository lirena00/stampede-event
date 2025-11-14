/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
"use server";
import { db } from "./db";

import { users } from "./db/schema";
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
  hash: string,
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

    // Find the user
    const user = await db.query.users.findFirst({
      where: and(eq(users.name, name), eq(users.email, email)),
    });

    // If user not found, return user not registered
    if (!user) {
      return {
        success: false,
        verified: true,
        message: "User not registered in the system",
      };
    }

    // Check if already attended
    if (user.attended) {
      return {
        success: false,
        verified: true,
        message: "Attendance already marked for this user",
        user: {
          name: user.name,
          email: user.email,
          status: user.status,
          screenshot: user.screenshot,
          attended: user.attended ?? false,
        },
      };
    }

    // Update the attendance
    await db
      .update(users)
      .set({
        attended: true,
      })
      .where(and(eq(users.name, name), eq(users.email, email)));

    return {
      success: true,
      verified: true,
      message: "Attendance marked successfully",
      user: {
        name: user.name,
        email: user.email,
        status: user.status,
        screenshot: user.screenshot,
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

// Update user status from "registered" to "verified"
export async function updateUserStatus(name: string, email: string) {
  try {
    // Find the user
    const user = await db.query.users.findFirst({
      where: and(eq(users.name, name), eq(users.email, email)),
    });

    // If user not found, return error
    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Only update if current status is "registered"
    if (user.status !== "registered") {
      return {
        success: false,
        message: `User status is already ${user.status}`,
      };
    }

    // Update the user status to "verified"
    await db
      .update(users)
      .set({
        status: "verified",
      })
      .where(and(eq(users.name, name), eq(users.email, email)));

    return {
      success: true,
      message: "User status updated to verified",
      user: {
        ...user,
        status: "verified",
      },
    };
  } catch (error) {
    console.error("Error updating user status:", error);
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
        const existingParticipant = await db.query.users.findFirst({
          where: and(
            eq(users.name, validatedData.fullName),
            eq(users.email, validatedData.email),
          ),
        });

        // If participant doesn't exist, add them
        if (!existingParticipant) {
          await db.insert(users).values({
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
  email: string,
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
    const allParticipants = await db.query.users.findMany({
      orderBy: [asc(users.name)],
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
      data.testEmails[0]!,
    );
    const ticketId = generateTicketId();
    const qrCodeImage = await generateQRCodeImage(
      data.participantName,
      data.testEmails[0]!,
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
          },
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
  attended: boolean,
) {
  try {
    // Update the attendance status
    await db
      .update(users)
      .set({
        attended: attended,
      })
      .where(eq(users.id, id));

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
      .update(users)
      .set({
        status: status,
      })
      .where(eq(users.id, id));

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
    await db.delete(users).where(eq(users.id, id));

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
  },
) {
  try {
    // Filter out undefined values
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    );

    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        message: "No data provided for update",
      };
    }

    // Update the participant details
    await db.update(users).set(updateData).where(eq(users.id, id));

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
    const participants = await db.query.users.findMany({
      where: inArray(users.id, data.selectedParticipants),
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
          participant.email,
        );
        const ticketId = generateTicketId();
        const qrCodeImage = await generateQRCodeImage(
          participant.name,
          participant.email,
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
          },
        );

        const autosendResult = await autosendResponse.json();

        if (autosendResponse.ok) {
          // Update participant record to mark ticket as sent
          await db
            .update(users)
            .set({
              ticket_sent: true,
              ticket_sent_at: new Date(),
            })
            .where(eq(users.id, participant.id));

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
