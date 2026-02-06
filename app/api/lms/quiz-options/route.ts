import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/lms-db";
import { QuizOptionSchema } from "@/lib/lms-validation";
import { QuizOption } from "@/types/lms";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get("challengeId");
    const optionId = searchParams.get("id");

    if (optionId) {
      const numericOptionId = Number(optionId);
      if (!Number.isInteger(numericOptionId) || numericOptionId <= 0) {
        return NextResponse.json(
          { success: false, error: "Invalid option ID" },
          { status: 400 },
        );
      }

      const options = await query<QuizOption>(
        "SELECT * FROM quiz_options WHERE id = $1",
        [numericOptionId],
      );

      if (options.length === 0) {
        return NextResponse.json(
          { success: false, error: "Option not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        data: options[0],
      });
    }

    if (challengeId) {
      const numericChallengeId = Number(challengeId);
      if (!Number.isInteger(numericChallengeId) || numericChallengeId <= 0) {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }

      const options = await query<QuizOption>(
        `SELECT * FROM quiz_options 
         WHERE challenge_id = $1 
         ORDER BY "order" ASC, id ASC`,
        [numericChallengeId],
      );

      return NextResponse.json({
        success: true,
        data: options,
      });
    }

    return NextResponse.json({
      success: true,
      data: [],
    });
  } catch (error) {
    console.error("[LMS API] Error fetching quiz options:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch quiz options" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = QuizOptionSchema.parse(body);

    // Calculate next order if not provided
    let order = validatedData.order ?? 0;
    if (order === 0) {
      const existingOptions = await query<{ max_order: number | null }>(
        'SELECT MAX("order") as max_order FROM quiz_options WHERE challenge_id = $1',
        [validatedData.challengeId],
      );
      const maxOrder = existingOptions[0]?.max_order ?? 0;
      order = (maxOrder || 0) + 1;
    }

    const result = await query<QuizOption>(
      `INSERT INTO quiz_options (challenge_id, text, correct, "order", image_src, audio_src)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        validatedData.challengeId,
        validatedData.text,
        validatedData.correct,
        order,
        validatedData.imageSrc || null,
        validatedData.audioSrc || null,
      ],
    );

    console.log("[LMS API] Quiz option created:", result[0]);

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("[LMS API] Error creating quiz option:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create quiz option",
      },
      { status: 400 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Option ID is required" },
        { status: 400 },
      );
    }

    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid option ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validatedData = QuizOptionSchema.partial().parse(body);

    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (validatedData.text !== undefined) {
      setClauses.push(`text = $${paramIndex}`);
      params.push(validatedData.text);
      paramIndex++;
    }
    if (validatedData.correct !== undefined) {
      setClauses.push(`correct = $${paramIndex}`);
      params.push(validatedData.correct);
      paramIndex++;
    }
    if (validatedData.order !== undefined) {
      setClauses.push(`"order" = $${paramIndex}`);
      params.push(validatedData.order);
      paramIndex++;
    }
    if (validatedData.imageSrc !== undefined) {
      setClauses.push(`image_src = $${paramIndex}`);
      params.push(validatedData.imageSrc);
      paramIndex++;
    }
    if (validatedData.audioSrc !== undefined) {
      setClauses.push(`audio_src = $${paramIndex}`);
      params.push(validatedData.audioSrc);
      paramIndex++;
    }

    if (setClauses.length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 },
      );
    }

    params.push(numericId);

    const result = await query<QuizOption>(
      `UPDATE quiz_options SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      params,
    );

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: "Option not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("[LMS API] Error updating quiz option:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update quiz option",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Option ID is required" },
        { status: 400 },
      );
    }

    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid option ID" },
        { status: 400 },
      );
    }

    const result = await query<QuizOption>(
      "DELETE FROM quiz_options WHERE id = $1 RETURNING *",
      [numericId],
    );

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: "Option not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("[LMS API] Error deleting quiz option:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete quiz option" },
      { status: 500 },
    );
  }
}
