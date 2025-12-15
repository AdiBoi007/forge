// FORGE - Resume Text Extraction Endpoint
// Accepts DOCX files server-side, PDF handled client-side
//
// NOTE: PDF parsing requires native Node.js modules that don't work
// in all runtimes. We handle PDFs client-side with PDF.js instead.

import { type NextRequest, NextResponse } from "next/server"
import type { ResumeExtractResponse, ResumeExtractMeta } from "@/lib/types"

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

export async function POST(request: NextRequest): Promise<NextResponse<ResumeExtractResponse>> {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          text: "",
          meta: { charCount: 0, isLikelyScanned: false, extractionMethod: "fallback" },
          error: "No file provided",
        },
        { status: 400 },
      )
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          text: "",
          meta: { charCount: 0, isLikelyScanned: false, extractionMethod: "fallback" },
          error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 },
      )
    }

    const mimeType = file.type
    const fileName = file.name

    // For PDFs, return instruction to use client-side extraction
    if (mimeType === "application/pdf") {
      return NextResponse.json({
        success: true,
        text: "",
        meta: {
          fileName,
          mimeType,
          charCount: 0,
          isLikelyScanned: false,
          extractionMethod: "client-side",
          warnings: ["PDF will be processed in browser. If extraction fails, please paste text manually."],
        },
        requiresClientExtraction: true,
      } as ResumeExtractResponse & { requiresClientExtraction: boolean })
    }

    // Validate file type for server-side processing
    if (mimeType !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      return NextResponse.json(
        {
          success: false,
          text: "",
          meta: {
            fileName,
            mimeType,
            charCount: 0,
            isLikelyScanned: false,
            extractionMethod: "fallback",
          },
          error: "Unsupported file type. Please upload a PDF or DOCX file.",
        },
        { status: 400 },
      )
    }

    const buffer = await file.arrayBuffer()
    let extractedText = ""
    let extractionMethod: ResumeExtractMeta["extractionMethod"] = "fallback"
    const warnings: string[] = []

    // Extract text from DOCX using mammoth
    try {
      const mammoth = await import("mammoth")
      const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
      extractedText = result.value || ""
      extractionMethod = "mammoth"

      if (result.messages && result.messages.length > 0) {
        warnings.push(...result.messages.map((m: { message: string }) => m.message).slice(0, 2))
      }
    } catch (error) {
      console.error("DOCX parsing error:", error)
      warnings.push("DOCX parsing failed - please paste resume text manually")
    }

    // Clean up extracted text
    extractedText = extractedText
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()

    const charCount = extractedText.length

    const meta: ResumeExtractMeta = {
      fileName,
      mimeType,
      charCount,
      isLikelyScanned: false,
      extractionMethod,
      warnings: warnings.length > 0 ? warnings : undefined,
    }

    return NextResponse.json({
      success: true,
      text: extractedText,
      meta,
    })
  } catch (error) {
    console.error("Resume extraction error:", error)
    return NextResponse.json(
      {
        success: false,
        text: "",
        meta: { charCount: 0, isLikelyScanned: false, extractionMethod: "fallback" },
        error: error instanceof Error ? error.message : "Failed to process resume",
      },
      { status: 500 },
    )
  }
}
