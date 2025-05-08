import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import Groq from "groq-sdk"
import { writeFile } from "fs/promises"
import { createReadStream, unlinkSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null

  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 })
    }

    try {
      if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY environment variable is not set")
      }

      // Initialize Groq client
      const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      })

      // Create a temporary file
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      tempFilePath = join(tmpdir(), `temp-audio-${Date.now()}.webm`)
      await writeFile(tempFilePath, buffer)

      // Create transcription using Groq
      const transcription = await groq.audio.transcriptions.create({
        file: createReadStream(tempFilePath),
        model: "whisper-large-v3",
        response_format: "verbose_json",
      })

      if (!transcription.text) {
        throw new Error("No transcription received from Groq API")
      }

      return NextResponse.json({
        transcription: transcription.text,
      })
    } catch (error: unknown) {
      console.error("Groq API Error:", error)
      throw new Error(error instanceof Error ? error.message : "Transcription failed")
    } finally {
      // Clean up temporary file
      if (tempFilePath) {
        try {
          unlinkSync(tempFilePath)
        } catch (error) {
          console.error("Error deleting temporary file:", error)
        }
      }
    }
  } catch (error: unknown) {
    console.error("Error in transcription:", error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
        details: process.env.NODE_ENV === "development" ? `${error}` : undefined,
      },
      { status: 500 },
    )
  }
}
