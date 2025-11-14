import { NextRequest, NextResponse } from "next/server";
import { createAttendees, checkAttendeeExists } from "~/server/queries";
import { z } from "zod";

const manualParticipantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  transactionId: z.string().optional(),
  screenshot: z.string().optional(),
  status: z.string().default("registered"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the incoming data
    const validatedData = manualParticipantSchema.parse(body);

    // Check if participant already exists
    const existingAttendee = await checkAttendeeExists(
      validatedData.name,
      validatedData.email
    );

    if (existingAttendee) {
      return NextResponse.json(
        {
          success: false,
          message: "Participant already exists with this name and email",
        },
        { status: 400 }
      );
    }

    // Create new attendee
    await createAttendees(
      validatedData.name,
      validatedData.email,
      validatedData.phone || "",
      validatedData.transactionId || "",
      validatedData.status,
      validatedData.screenshot || ""
    );

    return NextResponse.json({
      success: true,
      message: "Participant added successfully",
      participant: {
        name: validatedData.name,
        email: validatedData.email,
      },
    });
  } catch (error) {
    console.error("Manual participant creation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid data format",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create participant",
      },
      { status: 500 }
    );
  }
}
