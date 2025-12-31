import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import { auth } from "@/lib/auth";
import { deleteFile } from "@/lib/storage";
import { transcribeAudio } from "@/lib/transcription/whisper";
import type { TranscribeResponse } from "@/types/voice";

/**
 * Fetch audio file from either local filesystem or remote URL
 */
async function fetchAudioFile(audioUrl: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  // Check if it's a local file (relative URL starting with /uploads/)
  if (audioUrl.startsWith("/uploads/")) {
    const filepath = join(process.cwd(), "public", audioUrl);

    if (!existsSync(filepath)) {
      return null;
    }

    const buffer = await readFile(filepath);
    // Determine content type from extension
    const ext = audioUrl.split(".").pop()?.toLowerCase() || "webm";
    const mimeTypes: Record<string, string> = {
      webm: "audio/webm",
      mp4: "audio/mp4",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      m4a: "audio/m4a",
    };
    const contentType = mimeTypes[ext] || "audio/webm";

    return { buffer, contentType };
  }

  // Remote URL - use fetch
  const response = await fetch(audioUrl);
  if (!response.ok) {
    return null;
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = response.headers.get("content-type") || "audio/webm";

  return { buffer, contentType };
}

interface TranscribeRequest {
  uploadId: string;
  audioUrl: string;
  sessionId?: string;
}

/**
 * POST /api/voice/transcribe
 *
 * Transcribe an uploaded audio file using OpenAI Whisper.
 * The audio file is deleted after successful transcription for privacy.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Early validation: Check for required API key before any processing
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured");
      return NextResponse.json(
        { error: "Transcription service is not configured. Please set OPENAI_API_KEY." },
        { status: 503 }
      );
    }

    // Authenticate the request
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body
    let body: TranscribeRequest;
    try {
      body = (await request.json()) as TranscribeRequest;
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    const { uploadId, audioUrl, sessionId: _sessionId } = body;

    if (!uploadId || !audioUrl) {
      return NextResponse.json(
        { error: "Missing uploadId or audioUrl" },
        { status: 400 }
      );
    }

    // Fetch the audio file (handles both local files and remote URLs)
    const audioData = await fetchAudioFile(audioUrl);
    if (!audioData) {
      return NextResponse.json(
        { error: "Failed to fetch audio file" },
        { status: 400 }
      );
    }

    const { buffer, contentType } = audioData;

    // Determine file extension from content type
    const extension = contentType.split("/")[1]?.split(";")[0] || "webm";
    const filename = `${uploadId}.${extension}`;

    // Convert Buffer to Uint8Array for File constructor compatibility
    const uint8Array = new Uint8Array(buffer);

    // Convert to File for Whisper API
    const audioFile = new File([uint8Array], filename, { type: contentType });

    // Transcribe the audio
    const startTime = Date.now();

    const transcription: TranscribeResponse = await transcribeAudio(audioFile);

    const transcriptionTime = Date.now() - startTime;
    // Performance logging for monitoring
    if (process.env.NODE_ENV === "development") {
      console.warn(`[Transcription] ${uploadId}: completed in ${transcriptionTime}ms`);
    }

    // Delete the audio file for privacy
    try {
      await deleteFile(audioUrl);
    } catch (deleteError) {
      // Log but don't fail the request - file cleanup is non-critical
      console.error(`Failed to delete audio file ${uploadId}:`, deleteError);
    }

    return NextResponse.json(transcription);
  } catch (error) {
    console.error("Transcription error:", error);

    const errorMessage = error instanceof Error ? error.message : "Failed to transcribe audio";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
