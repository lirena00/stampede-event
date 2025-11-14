import { NextRequest, NextResponse } from "next/server";
import { createUsers, createFailedWebhook } from "~/server/queries";
import { toTitleCase } from "~/lib/utils";
import { checkUserExists as checkIfUserExists } from "~/server/queries";
import { z } from "zod";

// Updated schema to match your actual form fields
const googleFormsWebhookSchema = z.object({
  formId: z.string(),
  responseId: z.string(),
  timestamp: z.string(),
  responderEmail: z.email(),
  responses: z.object({
    "Full Name": z.string().min(1, "Full name is required"),
    "College Email ID": z.email("Invalid email address"),
    "Course + Branch": z.string().optional(),
    "Year of Study": z.string().optional(),
    "Whatsapp Number": z.string().optional(),
    "WhatsApp Number": z.string().optional(),
    "You are?": z.string().optional(),
    "University Roll No.": z.string().optional(),
    "UPI ID": z.string().optional(),
    "Screenshot of transaction": z
      .union([z.string(), z.array(z.string())])
      .optional(),
  }),
});

export async function POST(request: NextRequest) {
  let body: any;

  try {
    // Verify webhook source
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.WEBHOOK_SECRET_TOKEN;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    body = await request.json();
    console.log("Received webhook data:", body);

    // Validate the incoming data
    const validatedData = googleFormsWebhookSchema.parse(body);

    // Extract participant data
    const responses = validatedData.responses;
    const fullName = toTitleCase(responses["Full Name"].trim());
    const email = responses["College Email ID"].trim(); // Updated field name
    const responderEmail = validatedData.responderEmail; // The Google account used to submit
    const phone = (
      responses["Whatsapp Number"] ||
      responses["WhatsApp Number"] ||
      ""
    ).trim();
    const transactionId = responses["UPI ID"]?.trim() || "";

    // Handle screenshot - convert array to string URL if needed
    let screenshot = "";
    if (responses["Screenshot of transaction"]) {
      const screenshotData = responses["Screenshot of transaction"];
      if (Array.isArray(screenshotData)) {
        // Convert Google Drive file ID to viewable URL
        const fileId = screenshotData[0];
        screenshot = `https://drive.google.com/file/d/${fileId}/view`;
      } else {
        screenshot = screenshotData.trim();
      }
    }

    console.log(`College Email: ${email}`);
    console.log(
      `Submitter's Google Account: ${responderEmail || "Not available"}`,
    );
    console.log(`Screenshot URL: ${screenshot}`);

    // Check if participant already exists
    const existingUser = await checkIfUserExists(fullName, responderEmail);

    if (existingUser) {
      console.log(`User already exists: ${fullName} (${responderEmail})`);
      return NextResponse.json({
        success: true,
        message: "User already exists",
        skipped: true,
      });
    }

    // Create new user
    await createUsers(
      fullName,
      responderEmail,
      phone,
      transactionId,
      "registered", // Default status
      screenshot,
    );

    console.log(`New participant added: ${fullName} (${responderEmail})`);
    if (responderEmail) {
      console.log(`Submitted using Google account: ${responderEmail}`);
    }

    return NextResponse.json({
      success: true,
      message: "Participant added successfully",
      participant: {
        name: fullName,
        email: responderEmail,
        submittedBy: responderEmail,
      },
    });
  } catch (error) {
    console.error("Webhook processing error:", error);

    // Extract what data we can from the failed request
    const extractedData: any = {};

    if (body?.responses) {
      try {
        const responses = body.responses;
        extractedData.name = responses["Full Name"] || "";
        extractedData.email =
          responses["College Email ID"] || body.responderEmail || "";
        extractedData.phone =
          responses["Whatsapp Number"] || responses["WhatsApp Number"] || "";
        extractedData.transactionId = responses["UPI ID"] || "";

        if (responses["Screenshot of transaction"]) {
          const screenshotData = responses["Screenshot of transaction"];
          if (Array.isArray(screenshotData)) {
            extractedData.screenshot = `https://drive.google.com/file/d/${screenshotData[0]}/view`;
          } else {
            extractedData.screenshot = screenshotData;
          }
        }
      } catch (extractError) {
        console.error(
          "Error extracting data from failed webhook:",
          extractError,
        );
      }
    }

    // Save failed webhook for later processing
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorDetails =
      error instanceof z.ZodError ? JSON.stringify(error.issues) : "";

    await createFailedWebhook(
      JSON.stringify(body || {}),
      errorMessage,
      errorDetails,
      extractedData,
    );

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid data format",
          details: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
