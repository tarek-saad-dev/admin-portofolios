import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/lms-db";
import { ChallengeSchema } from "@/lib/lms-validation";
import { Challenge } from "@/types/lms";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get("lessonId");
    const challengeId = searchParams.get("challengeId");

    if (challengeId) {
      const numericChallengeId = Number(challengeId);
      if (!Number.isInteger(numericChallengeId) || numericChallengeId <= 0) {
        return NextResponse.json(
          { success: false, error: "Invalid challenge ID" },
          { status: 400 },
        );
      }

      const challenges = await query<Challenge>(
        "SELECT * FROM challenges WHERE id = $1",
        [numericChallengeId],
      );

      if (challenges.length === 0) {
        return NextResponse.json(
          { success: false, error: "Challenge not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        data: challenges[0],
      });
    }

    if (lessonId) {
      const numericLessonId = Number(lessonId);
      if (!Number.isInteger(numericLessonId) || numericLessonId <= 0) {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }

      const challenges = await query<Challenge>(
        `SELECT * FROM challenges
         WHERE lesson_id = $1
         ORDER BY "order" ASC, id ASC`,
        [numericLessonId],
      );

      return NextResponse.json({
        success: true,
        data: challenges,
      });
    }

    const challenges = await query<Challenge>(
      "SELECT * FROM challenges ORDER BY id DESC LIMIT 100",
    );

    return NextResponse.json({
      success: true,
      data: challenges,
    });
  } catch (error) {
    console.error("[LMS API] Error fetching challenges:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch challenges" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ChallengeSchema.parse(body);

    // Build values array with all columns, defaulting to null
    const result = await query<Challenge>(
      `INSERT INTO challenges (lesson_id, type, label, "order", explanation, text_content, image_content, video_url, pdf_url,
                              initial_code, language, instructions, test_cases, time_limit, memory_limit,
                              complete_question, project_structure, project_files, project_test_cases, test_setup, test_teardown,
                              web_view_content)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
       RETURNING *`,
      [
        validatedData.lessonId,
        validatedData.type,
        validatedData.label,
        validatedData.order || 0,
        validatedData.explanation || null,
        validatedData.textContent || null,
        validatedData.imageContent || null,
        validatedData.videoUrl || null,
        validatedData.pdfUrl || null,
        validatedData.initialCode || null,
        validatedData.language || null,
        validatedData.instructions || null,
        validatedData.testCases
          ? JSON.stringify(validatedData.testCases)
          : null,
        validatedData.timeLimit || null,
        validatedData.memoryLimit || null,
        validatedData.completeQuestion || null,
        validatedData.projectStructure
          ? JSON.stringify(validatedData.projectStructure)
          : null,
        validatedData.projectFiles
          ? JSON.stringify(validatedData.projectFiles)
          : null,
        validatedData.projectTestCases
          ? JSON.stringify(validatedData.projectTestCases)
          : null,
        validatedData.testSetup || null,
        validatedData.testTeardown || null,
        validatedData.webViewContent || null,
      ],
    );

    console.log("[LMS API] Challenge created:", result[0]);

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("[LMS API] Error creating challenge:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create challenge",
      },
      { status: 400 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Challenge ID is required" },
        { status: 400 },
      );
    }

    const validatedData = ChallengeSchema.partial().parse(updateData);

    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (validatedData.type !== undefined) {
      setClauses.push(`type = $${paramIndex}`);
      params.push(validatedData.type);
      paramIndex++;
    }
    if (validatedData.label !== undefined) {
      setClauses.push(`label = $${paramIndex}`);
      params.push(validatedData.label);
      paramIndex++;
    }
    if (validatedData.order !== undefined) {
      setClauses.push(`"order" = $${paramIndex}`);
      params.push(validatedData.order);
      paramIndex++;
    }
    if (validatedData.explanation !== undefined) {
      setClauses.push(`explanation = $${paramIndex}`);
      params.push(validatedData.explanation);
      paramIndex++;
    }
    if (validatedData.textContent !== undefined) {
      setClauses.push(`text_content = $${paramIndex}`);
      params.push(validatedData.textContent);
      paramIndex++;
    }
    if (validatedData.imageContent !== undefined) {
      setClauses.push(`image_content = $${paramIndex}`);
      params.push(validatedData.imageContent);
      paramIndex++;
    }
    if (validatedData.videoUrl !== undefined) {
      setClauses.push(`video_url = $${paramIndex}`);
      params.push(validatedData.videoUrl);
      paramIndex++;
    }
    if (validatedData.pdfUrl !== undefined) {
      setClauses.push(`pdf_url = $${paramIndex}`);
      params.push(validatedData.pdfUrl);
      paramIndex++;
    }
    if (validatedData.initialCode !== undefined) {
      setClauses.push(`initial_code = $${paramIndex}`);
      params.push(validatedData.initialCode);
      paramIndex++;
    }
    if (validatedData.language !== undefined) {
      setClauses.push(`language = $${paramIndex}`);
      params.push(validatedData.language);
      paramIndex++;
    }
    if (validatedData.instructions !== undefined) {
      setClauses.push(`instructions = $${paramIndex}`);
      params.push(validatedData.instructions);
      paramIndex++;
    }
    if (validatedData.testCases !== undefined) {
      setClauses.push(`test_cases = $${paramIndex}`);
      params.push(JSON.stringify(validatedData.testCases));
      paramIndex++;
    }
    if (validatedData.timeLimit !== undefined) {
      setClauses.push(`time_limit = $${paramIndex}`);
      params.push(validatedData.timeLimit);
      paramIndex++;
    }
    if (validatedData.memoryLimit !== undefined) {
      setClauses.push(`memory_limit = $${paramIndex}`);
      params.push(validatedData.memoryLimit);
      paramIndex++;
    }
    if (validatedData.completeQuestion !== undefined) {
      setClauses.push(`complete_question = $${paramIndex}`);
      params.push(validatedData.completeQuestion);
      paramIndex++;
    }
    if (validatedData.projectStructure !== undefined) {
      setClauses.push(`project_structure = $${paramIndex}`);
      params.push(JSON.stringify(validatedData.projectStructure));
      paramIndex++;
    }
    if (validatedData.projectFiles !== undefined) {
      setClauses.push(`project_files = $${paramIndex}`);
      params.push(JSON.stringify(validatedData.projectFiles));
      paramIndex++;
    }
    if (validatedData.projectTestCases !== undefined) {
      setClauses.push(`project_test_cases = $${paramIndex}`);
      params.push(JSON.stringify(validatedData.projectTestCases));
      paramIndex++;
    }
    if (validatedData.testSetup !== undefined) {
      setClauses.push(`test_setup = $${paramIndex}`);
      params.push(validatedData.testSetup);
      paramIndex++;
    }
    if (validatedData.testTeardown !== undefined) {
      setClauses.push(`test_teardown = $${paramIndex}`);
      params.push(validatedData.testTeardown);
      paramIndex++;
    }
    if (validatedData.webViewContent !== undefined) {
      setClauses.push(`web_view_content = $${paramIndex}`);
      params.push(validatedData.webViewContent);
      paramIndex++;
    }

    params.push(id);

    const result = await query<Challenge>(
      `UPDATE challenges SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      params,
    );

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: "Challenge not found" },
        { status: 404 },
      );
    }

    console.log("[LMS API] Challenge updated:", result[0]);

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("[LMS API] Error updating challenge:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update challenge",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");

    if (!idParam) {
      return NextResponse.json(
        { success: false, error: "Challenge ID is required" },
        { status: 400 },
      );
    }

    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid challenge ID" },
        { status: 400 },
      );
    }

    // Delete related records first (cascade)
    // quiz_options, word_options will cascade if FK constraints are set
    // Otherwise delete them explicitly
    await query("DELETE FROM quiz_options WHERE challenge_id = $1", [id]);
    await query("DELETE FROM word_options WHERE challenge_id = $1", [id]);

    // Delete the challenge
    const result = await query<Challenge>(
      "DELETE FROM challenges WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: "Challenge not found" },
        { status: 404 },
      );
    }

    console.log("[LMS API] Challenge deleted:", id);

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("[LMS API] Error deleting challenge:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete challenge" },
      { status: 500 },
    );
  }
}
