import { NextRequest, NextResponse } from "next/server";
import {
  getAllFailedWebhooks,
  updateFailedWebhook,
  deleteFailedWebhook,
  resolveFailedWebhook,
} from "~/server/queries";

export async function GET() {
  try {
    const failedWebhooks = await getAllFailedWebhooks();
    return NextResponse.json({ success: true, data: failedWebhooks });
  } catch (error) {
    console.error("Error fetching failed webhooks:", error);
    return NextResponse.json(
      { error: "Failed to fetch failed webhooks" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    let result;

    if (action === "resolve") {
      result = await resolveFailedWebhook(id);
    } else {
      result = await updateFailedWebhook(id, updateData);
    }

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    console.error("Error updating failed webhook:", error);
    return NextResponse.json(
      { error: "Failed to update failed webhook" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const result = await deleteFailedWebhook(parseInt(id));

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    console.error("Error deleting failed webhook:", error);
    return NextResponse.json(
      { error: "Failed to delete failed webhook" },
      { status: 500 },
    );
  }
}
