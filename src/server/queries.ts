import "server-only";
import { db } from "./db";

import { users, failedWebhooks } from "./db/schema";
import { and, eq, sql, asc, desc, count } from "drizzle-orm";

export async function createUsers(
  name: string,
  email: string,
  phone: string,
  transaction_id: string,
  status: string,
  screenshot: string,
) {
  const user = await db.query.users.findFirst({
    where: (user, { eq }) => eq(user.name, name),
  });
  if (!user) {
    await db.insert(users).values({
      name: name,
      email: email,
      phone: phone,
      transaction_id: transaction_id,
      status: status,
      screenshot: screenshot,
    });
  }
}

export async function checkUserExists(name: string, email: string) {
  try {
    const existingUser = await db.query.users.findFirst({
      where: and(eq(users.name, name), eq(users.email, email)),
    });

    return existingUser;
  } catch (error) {
    console.error("Error checking user existence:", error);
    throw new Error("Failed to check user existence");
  }
}

export async function createUserFromWebhook(
  name: string,
  email: string,
  phone?: string,
  transactionId?: string,
  screenshot?: string,
) {
  try {
    const newUser = await db
      .insert(users)
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

    return { success: true, user: newUser[0] };
  } catch (error) {
    console.error("Error creating user from webhook:", error);
    return { success: false, error: "Failed to create user" };
  }
}

export async function getAllUsers() {
  const userData = await db
    .select({
      id: users.id,
      name: users.name,
      status: users.status,
      attended: users.attended,
      phone: users.phone,
      email: users.email,
      ticket_sent: users.ticket_sent,
      ticket_sent_at: users.ticket_sent_at,
      transaction_id: users.transaction_id,
      screenshot: users.screenshot,
      created_at: users.created_at,
    })
    .from(users)
    .orderBy(desc(users.created_at));

  return userData;
}

export async function getDashboardStats() {
  const totalUsers = await db.select({ count: count() }).from(users);

  const registeredUsers = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.status, "registered"));

  const attendedUsers = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.attended, true));

  const notAttendedUsers = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.attended, false));

  const ticketsSentUsers = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.ticket_sent, true));

  const ticketsNotSentUsers = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.ticket_sent, false));

  return {
    totalUsers: totalUsers[0]?.count || 0,
    registeredUsers: registeredUsers[0]?.count || 0,
    attendedUsers: attendedUsers[0]?.count || 0,
    notAttendedUsers: notAttendedUsers[0]?.count || 0,
    ticketsSentUsers: ticketsSentUsers[0]?.count || 0,
    ticketsNotSentUsers: ticketsNotSentUsers[0]?.count || 0,
    attendanceRate: totalUsers[0]?.count
      ? Math.round(((attendedUsers[0]?.count || 0) / totalUsers[0].count) * 100)
      : 0,
    ticketSentRate: totalUsers[0]?.count
      ? Math.round(
          ((ticketsSentUsers[0]?.count || 0) / totalUsers[0].count) * 100,
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
  },
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
  },
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

    // Create user from extracted data
    if (failedWebhook.extracted_name && failedWebhook.extracted_email) {
      await createUsers(
        failedWebhook.extracted_name,
        failedWebhook.extracted_email,
        failedWebhook.extracted_phone || "",
        failedWebhook.extracted_transaction_id || "",
        "registered",
        failedWebhook.extracted_screenshot || "",
      );

      // Mark as resolved
      await updateFailedWebhook(id, { status: "resolved" });

      return {
        success: true,
        message: "Failed webhook resolved and user created",
      };
    } else {
      return { success: false, error: "Insufficient data to create user" };
    }
  } catch (error) {
    console.error("Error resolving failed webhook:", error);
    return { success: false, error: "Failed to resolve webhook" };
  }
}
