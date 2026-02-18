import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 },
      );
    }

    const { prompt, mode = "quick" } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    // Use gemini-2.5-flash - verified to support generateContent via ListModels
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Construct the system prompt based on mode
    const systemPrompt = buildSystemPrompt(mode);
    const fullPrompt = `${systemPrompt}\n\nUser Task:\n${prompt}`;

    // Generate content
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    let parsedPlan;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch =
        text.match(/```json\n([\s\S]*?)\n```/) ||
        text.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;
      parsedPlan = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      return NextResponse.json(
        { error: "Failed to parse AI response", rawResponse: text },
        { status: 500 },
      );
    }

    // Validate response structure
    if (!parsedPlan.planTitle || !Array.isArray(parsedPlan.nodes)) {
      return NextResponse.json(
        { error: "Invalid response structure from AI", response: parsedPlan },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      plan: parsedPlan,
    });
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate plan" },
      { status: 500 },
    );
  }
}

function buildSystemPrompt(mode: string): string {
  const baseRules = `You are an expert task decomposition AI. Your job is to break down complex tasks into clear, actionable execution steps.

CRITICAL: You MUST respond with valid JSON only. No explanations, no markdown, just pure JSON.

Required JSON format:
{
  "planTitle": "Clear title for the plan",
  "estimatedTotalMinutes": <total time in minutes>,
  "nodes": [
    {
      "title": "Action verb + clear step (max 6 words)",
      "description": "1-2 sentence explanation of what and why",
      "estimateMinutes": <realistic time estimate>,
      "effort": <1-5 scale>,
      "impact": <1-5 scale>,
      "tags": ["optional", "category", "tags"]
    }
  ]
}

RULES:
1. Every step title MUST start with an action verb (Create, Build, Design, Implement, Test, Deploy, etc.)
2. NO vague steps like "Setup" or "Prepare" - be specific
3. Steps must be in logical execution order
4. Last step MUST be a clear outcome (Publish, Deploy, Launch, Deliver, Complete)
5. If task is large (>8 steps), split into phases with phase markers
6. Default structure is LINEAR (step1 → step2 → step3)
7. Effort scale: 1=trivial, 2=easy, 3=moderate, 4=hard, 5=very hard
8. Impact scale: 1=minimal, 2=small, 3=medium, 4=high, 5=critical
9. Time estimates should be realistic (consider complexity)
10. Use Arabic or English based on input language`;

  if (mode === "detailed") {
    return `${baseRules}

MODE: DETAILED PLAN
- Provide 8-15 steps with thorough breakdown
- Include sub-tasks where needed
- Add more context in descriptions
- Be comprehensive but not overwhelming`;
  } else if (mode === "checklist") {
    return `${baseRules}

MODE: CHECKLIST
- Provide 4-8 high-level steps
- Focus on major milestones
- Keep descriptions brief
- Emphasize outcomes over process`;
  } else {
    return `${baseRules}

MODE: QUICK PLAN
- Provide 5-8 essential steps
- Focus on core workflow
- Balance detail with brevity
- Cover end-to-end execution`;
  }
}
