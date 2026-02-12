import { NextRequest, NextResponse } from "next/server";

// Extract file ID from Google Drive URL
function extractGoogleDriveFileId(url: string): string | null {
  if (!url) return null;

  // Pattern 1: https://drive.google.com/file/d/{fileId}/view
  const pattern1 = /\/file\/d\/([a-zA-Z0-9_-]+)/;
  const match1 = url.match(pattern1);
  if (match1) return match1[1];

  // Pattern 2: https://drive.google.com/open?id={fileId}
  const pattern2 = /[?&]id=([a-zA-Z0-9_-]+)/;
  const match2 = url.match(pattern2);
  if (match2) return match2[1];

  // Pattern 3: https://drive.google.com/uc?id={fileId}
  const pattern3 = /uc\?.*id=([a-zA-Z0-9_-]+)/;
  const match3 = url.match(pattern3);
  if (match3) return match3[1];

  // Pattern 4: https://docs.google.com/file/d/{fileId}
  const pattern4 = /docs\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const match4 = url.match(pattern4);
  if (match4) return match4[1];

  return null;
}

// Check if buffer starts with PDF magic header
function isPdfBuffer(buffer: ArrayBuffer): boolean {
  const uint8Array = new Uint8Array(buffer);
  // PDF files start with "%PDF-" (0x25 0x50 0x44 0x46 0x2D)
  if (uint8Array.length < 5) return false;
  return (
    uint8Array[0] === 0x25 && // %
    uint8Array[1] === 0x50 && // P
    uint8Array[2] === 0x44 && // D
    uint8Array[3] === 0x46 && // F
    uint8Array[4] === 0x2d // -
  );
}

// Check if buffer starts with HTML
function isHtmlBuffer(buffer: ArrayBuffer): boolean {
  const uint8Array = new Uint8Array(buffer);
  const text = new TextDecoder().decode(uint8Array.slice(0, 200));
  const lowerText = text.toLowerCase();
  return lowerText.includes("<!doctype html") || lowerText.includes("<html");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gdriveUrl = searchParams.get("url");

    if (!gdriveUrl) {
      return NextResponse.json(
        { success: false, error: "Missing 'url' parameter" },
        { status: 400 },
      );
    }

    // Extract file ID from Google Drive URL
    const fileId = extractGoogleDriveFileId(gdriveUrl);
    if (!fileId) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Google Drive URL. Could not extract file ID.",
        },
        { status: 400 },
      );
    }

    // ALWAYS use direct download URL - never use view URL
    const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    // Fetch the file from Google Drive
    const response = await fetch(directUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      // Check for common Google Drive errors
      if (response.status === 403) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Access denied. Ensure the file is shared as "Anyone with the link".',
          },
          { status: 403 },
        );
      }
      if (response.status === 404) {
        return NextResponse.json(
          {
            success: false,
            error: "File not found. Check the file ID or sharing settings.",
          },
          { status: 404 },
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch file from Google Drive: ${response.statusText}`,
        },
        { status: response.status },
      );
    }

    // Get response content type and content disposition
    const responseContentType = (
      response.headers.get("Content-Type") || ""
    ).toLowerCase();
    const contentDisposition = (
      response.headers.get("Content-Disposition") || ""
    ).toLowerCase();

    // Get the file data
    const fileBuffer = await response.arrayBuffer();

    // Check if response is HTML (permission/preview page)
    if (responseContentType.includes("text/html") || isHtmlBuffer(fileBuffer)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Drive did not return the file. Ensure sharing is 'Anyone with the link' and try again.",
        },
        { status: 400 },
      );
    }

    // Tolerant PDF validation
    let isPdf = false;

    // Check 1: Content-Type is application/pdf
    if (responseContentType.includes("application/pdf")) {
      isPdf = true;
    }
    // Check 2: Content-Type is octet-stream but file has PDF magic header
    else if (
      responseContentType.includes("application/octet-stream") &&
      isPdfBuffer(fileBuffer)
    ) {
      isPdf = true;
    }
    // Check 3: Content-Disposition filename ends with .pdf
    else if (contentDisposition.includes(".pdf")) {
      isPdf = true;
    }
    // Check 4: Final truth - check PDF magic header directly
    else if (isPdfBuffer(fileBuffer)) {
      isPdf = true;
    }

    if (!isPdf) {
      return NextResponse.json(
        {
          success: false,
          error: "This Google Drive file is not a PDF document.",
        },
        { status: 400 },
      );
    }

    // Stream the PDF with correct headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="file.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[Media Proxy] Error streaming Google Drive PDF:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to stream PDF file",
      },
      { status: 500 },
    );
  }
}
