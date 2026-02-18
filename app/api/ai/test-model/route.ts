import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Test endpoint to verify Gemini model works
export async function GET(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Test with gemini-1.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent("Say 'Hello, I am working!' in JSON format with a 'message' field.");
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      success: true,
      model: "gemini-1.5-flash",
      response: text,
      message: "Model is working correctly!"
    });
  } catch (error: any) {
    console.error("Model test error:", error);
    return NextResponse.json(
      {
        error: error.message,
        details: error.toString(),
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
