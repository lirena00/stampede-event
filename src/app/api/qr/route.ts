import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import * as crypto from "crypto";

const SECRET = "gfgscglau_ki_jai_wu_hu_hehe";

function generateQRCodeHash(name: string, email: string): string {
  const hashString = `${name}|${email}|${SECRET}`;
  return crypto.createHash("sha256").update(hashString).digest("hex");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const email = searchParams.get("email");

    if (!name || !email) {
      return new NextResponse("Missing name or email parameters", {
        status: 400,
      });
    }

    const qrData = JSON.stringify({
      name,
      email,
      hash: generateQRCodeHash(name, email),
      timestamp: Date.now(),
    });

    // Generate QR code as PNG buffer
    const qrCodeBuffer = await QRCode.toBuffer(qrData, {
      type: "png",
      width: 200,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    const uint8Array = new Uint8Array(qrCodeBuffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("QR code generation error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
