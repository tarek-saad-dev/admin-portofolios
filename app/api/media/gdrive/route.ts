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

  // Pattern 3: https://docs.google.com/file/d/{fileId}
  const pattern3 = /docs\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const match3 = url.match(pattern3);
  if (match3) return match3[1];

  return null;
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

    // Convert to direct download URL
    // Using the export endpoint which works better for streaming
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

    // Validate MIME type - must be audio
    const responseContentType = response.headers.get("Content-Type") || "";
    const allowedAudioTypes = [
      "audio/mpeg", // mp3
      "audio/wav", // wav
      "audio/x-wav", // wav (alternative)
      "audio/mp4", // m4a
    ];

    const isAudio = allowedAudioTypes.some((type) =>
      responseContentType.toLowerCase().includes(type),
    );

    if (!isAudio) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This Google Drive file is not a supported audio format (mp3, wav, m4a).",
        },
        { status: 400 },
      );
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer();

    // Stream the audio with correct headers (use actual content type from Google Drive)
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": responseContentType,
        "Cache-Control": "public, max-age=3600",
        "Accept-Ranges": "bytes",
      },
    });
  } catch (error) {
    console.error("[Media Proxy] Error streaming Google Drive audio:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to stream audio file",
      },
      { status: 500 },
    );
  }
}
