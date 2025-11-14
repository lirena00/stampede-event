import { NextResponse } from "next/server";
import { processCsvUpload } from "~/server/actions";

export async function POST(req: Request) {
  try {
    // Get the form data from the request
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No CSV file uploaded" },
        { status: 400 },
      );
    }

    // Check file type
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "Please upload a CSV file" },
        { status: 400 },
      );
    }

    // Read the file content
    const fileContent = await file.text();

    // Process the CSV content using our server action
    const result = await processCsvUpload(fileContent);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error processing CSV:", error);
    return NextResponse.json(
      { error: "Error processing CSV file" },
      { status: 500 },
    );
  }
}
