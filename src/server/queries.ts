import "server-only";
import { db } from "./db";

import { attendees, failedWebhooks } from "./db/schema";
import { and, eq, sql, asc, desc, count } from "drizzle-orm";

export async function createAttendees(
  name: string,
  email: string,
  phone: string,
  transaction_id: string,
  status: string,
  screenshot: string
) {
  const attendee = await db.query.attendees.findFirst({
    where: (attendee, { eq }) => eq(attendee.name, name),
  });
  if (!attendee) {
    await db.insert(attendees).values({
      name: name,
      email: email,
      phone: phone,
      transaction_id: transaction_id,
      status: status,
      screenshot: screenshot,
    });
  }
}

export async function checkAttendeeExists(name: string, email: string) {
  try {
    const existingAttendee = await db.query.attendees.findFirst({
      where: and(eq(attendees.name, name), eq(attendees.email, email)),
    });

    return existingAttendee;
  } catch (error) {
    console.error("Error checking attendee existence:", error);
    throw new Error("Failed to check attendee existence");
  }
}

export async function createAttendeeFromWebhook(
  name: string,
  email: string,
  phone?: string,
  transactionId?: string,
  screenshot?: string
) {
  try {
    const newAttendee = await db
      .insert(attendees)
      .values({
        name,
        email,
        phone: phone || "",
        transaction_id: transactionId || "",
        status: "registered",
        screenshot: screenshot || "",
        created_at: new Date(),
      })
      .returning();

    return { success: true, attendee: newAttendee[0] };
  } catch (error) {
    console.error("Error creating attendee from webhook:", error);
    return { success: false, error: "Failed to create attendee" };
  }
}

export async function getAllAttendees() {
  const attendeeData = await db
    .select({
      id: attendees.id,
      name: attendees.name,
      status: attendees.status,
      attended: attendees.attended,
      phone: attendees.phone,
      email: attendees.email,
      ticket_sent: attendees.ticket_sent,
      ticket_sent_at: attendees.ticket_sent_at,
      transaction_id: attendees.transaction_id,
      screenshot: attendees.screenshot,
      created_at: attendees.created_at,
    })
    .from(attendees)
    .orderBy(desc(attendees.created_at));

  return attendeeData;
}

export async function getDashboardStats() {
  const totalAttendees = await db.select({ count: count() }).from(attendees);

  const registeredAttendees = await db
    .select({ count: count() })
    .from(attendees)
    .where(eq(attendees.status, "registered"));

  const attendedUsers = await db
    .select({ count: count() })
    .from(attendees)
    .where(eq(attendees.attended, true));

  const notAttendedUsers = await db
    .select({ count: count() })
    .from(attendees)
    .where(eq(attendees.attended, false));

  const ticketsSentUsers = await db
    .select({ count: count() })
    .from(attendees)
    .where(eq(attendees.ticket_sent, true));

  const ticketsNotSentUsers = await db
    .select({ count: count() })
    .from(attendees)
    .where(eq(attendees.ticket_sent, false));

  return {
    totalUsers: totalAttendees[0]?.count || 0,
    registeredUsers: registeredAttendees[0]?.count || 0,
    attendedUsers: attendedUsers[0]?.count || 0,
    notAttendedUsers: notAttendedUsers[0]?.count || 0,
    ticketsSentUsers: ticketsSentUsers[0]?.count || 0,
    ticketsNotSentUsers: ticketsNotSentUsers[0]?.count || 0,
    attendanceRate: totalAttendees[0]?.count
      ? Math.round(
          ((attendedUsers[0]?.count || 0) / totalAttendees[0].count) * 100
        )
      : 0,
    ticketSentRate: totalAttendees[0]?.count
      ? Math.round(
          ((ticketsSentUsers[0]?.count || 0) / totalAttendees[0].count) * 100
        )
      : 0,
  };
}

// Failed webhooks functions
export async function createFailedWebhook(
  rawData: string,
  errorMessage: string,
  errorDetails?: string,
  extractedData?: {
    name?: string;
    email?: string;
    phone?: string;
    transactionId?: string;
    screenshot?: string;
  }
) {
  try {
    const failedWebhook = await db
      .insert(failedWebhooks)
      .values({
        raw_data: rawData,
        error_message: errorMessage,
        error_details: errorDetails || "",
        extracted_name: extractedData?.name || "",
        extracted_email: extractedData?.email || "",
        extracted_phone: extractedData?.phone || "",
        extracted_transaction_id: extractedData?.transactionId || "",
        extracted_screenshot: extractedData?.screenshot || "",
        status: "pending",
      })
      .returning();

    return { success: true, failedWebhook: failedWebhook[0] };
  } catch (error) {
    console.error("Error creating failed webhook:", error);
    return { success: false, error: "Failed to save failed webhook" };
  }
}

export async function getAllFailedWebhooks() {
  try {
    const failedWebhookData = await db
      .select()
      .from(failedWebhooks)
      .orderBy(desc(failedWebhooks.created_at));

    return failedWebhookData;
  } catch (error) {
    console.error("Error fetching failed webhooks:", error);
    throw new Error("Failed to fetch failed webhooks");
  }
}

export async function updateFailedWebhook(
  id: number,
  data: {
    extracted_name?: string;
    extracted_email?: string;
    extracted_phone?: string;
    extracted_transaction_id?: string;
    extracted_screenshot?: string;
    notes?: string;
    status?: string;
  }
) {
  try {
    const updated = await db
      .update(failedWebhooks)
      .set({
        ...data,
        resolved_at: data.status === "resolved" ? new Date() : undefined,
      })
      .where(eq(failedWebhooks.id, id))
      .returning();

    return { success: true, failedWebhook: updated[0] };
  } catch (error) {
    console.error("Error updating failed webhook:", error);
    return { success: false, error: "Failed to update failed webhook" };
  }
}

export async function deleteFailedWebhook(id: number) {
  try {
    await db.delete(failedWebhooks).where(eq(failedWebhooks.id, id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting failed webhook:", error);
    return { success: false, error: "Failed to delete failed webhook" };
  }
}

export async function resolveFailedWebhook(id: number) {
  try {
    const failedWebhook = await db.query.failedWebhooks.findFirst({
      where: eq(failedWebhooks.id, id),
    });

    if (!failedWebhook) {
      return { success: false, error: "Failed webhook not found" };
    }

    // Create attendee from extracted data
    if (failedWebhook.extracted_name && failedWebhook.extracted_email) {
      await createAttendees(
        failedWebhook.extracted_name,
        failedWebhook.extracted_email,
        failedWebhook.extracted_phone || "",
        failedWebhook.extracted_transaction_id || "",
        "registered",
        failedWebhook.extracted_screenshot || ""
      );

      // Mark as resolved
      await updateFailedWebhook(id, { status: "resolved" });

      return {
        success: true,
        message: "Failed webhook resolved and attendee created",
      };
    } else {
      return { success: false, error: "Insufficient data to create user" };
    }
  } catch (error) {
    console.error("Error resolving failed webhook:", error);
    return { success: false, error: "Failed to resolve webhook" };
  }
}
