import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { upload } from "@/lib/storage";

// Maximum file size: 25MB (Whisper limit)
const MAX_FILE_SIZE = 25 * 1024 * 1024;

// Allowed audio types
const ALLOWED_TYPES = [
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/m4a",
  "audio/x-m4a",
];

interface UploadResponse {
  uploadId: string;
  status: "uploaded";
  durationSeconds?: number;
  fileSizeBytes: number;
  url: string;
}

/**
 * POST /api/voice/upload
 *
 * Upload an audio file for transcription.
 * The file is stored temporarily and will be deleted after transcription.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate the request
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the form data
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Validate file type (handle MIME types with parameters like "audio/webm;codecs=opus")
    const baseType = audioFile.type.split(";")[0]?.trim() ?? audioFile.type;
    if (!ALLOWED_TYPES.includes(baseType)) {
      return NextResponse.json(
        { error: `Invalid file type: ${audioFile.type}. Allowed: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Generate a unique upload ID
    const uploadId = crypto.randomUUID();
    // Extract extension from base MIME type (e.g., "audio/webm" -> "webm")
    const extension = baseType.split("/")[1] ?? "webm";
    const filename = `${uploadId}.${extension}`;

    // Upload to storage (temporary folder)
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    const uploadResult = await upload(audioBuffer, filename, "voice-uploads");

    const response: UploadResponse = {
      uploadId,
      status: "uploaded",
      fileSizeBytes: audioFile.size,
      url: uploadResult.url,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload audio file" },
      { status: 500 }
    );
  }
}
