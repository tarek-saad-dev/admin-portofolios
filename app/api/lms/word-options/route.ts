import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/lms-db";
import { WordOption } from "@/types/lms";
import { z } from "zod";

const WordOptionSchema = z.object({
  id: z.number().optional(),
  challengeId: z.number(),
  word: z.string().min(1, "Word is required"),
  order: z.number().int().min(0).optional(),
  correct: z.boolean(),
});

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

      const options = await query<WordOption>(
        "SELECT * FROM word_options WHERE id = $1",
        [numericOptionId],
      );

      if (options.length === 0) {
        return NextResponse.json(
          { success: false, error: "Word option not found" },
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

      const options = await query<WordOption>(
        `SELECT * FROM word_options 
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
    console.error("[LMS API] Error fetching word options:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch word options" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = WordOptionSchema.parse(body);

    // Calculate next order if not provided
    let order = validatedData.order ?? 0;
    if (order === 0) {
      const existingOptions = await query<{ max_order: number | null }>(
        "SELECT MAX(\"order\") as max_order FROM word_options WHERE challenge_id = $1",
        [validatedData.challengeId],
      );
      const maxOrder = existingOptions[0]?.max_order ?? 0;
      order = (maxOrder || 0) + 1;
    }

    const result = await query<WordOption>(
      `INSERT INTO word_options (challenge_id, word, "order", correct)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        validatedData.challengeId,
        validatedData.word,
        order,
        validatedData.correct,
      ],
    );

    console.log("[LMS API] Word option created:", result[0]);

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("[LMS API] Error creating word option:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create word option",
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
        { success: false, error: "Word option ID is required" },
        { status: 400 },
      );
    }

    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid word option ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validatedData = WordOptionSchema.partial().parse(body);

    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (validatedData.word !== undefined) {
      setClauses.push(`word = $${paramIndex}`);
      params.push(validatedData.word);
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

    if (setClauses.length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 },
      );
    }

    params.push(numericId);

    const result = await query<WordOption>(
      `UPDATE word_options SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      params,
    );

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: "Word option not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("[LMS API] Error updating word option:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update word option",
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
        { success: false, error: "Word option ID is required" },
        { status: 400 },
      );
    }

    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid word option ID" },
        { status: 400 },
      );
    }

    const result = await query<WordOption>(
      "DELETE FROM word_options WHERE id = $1 RETURNING *",
      [numericId],
    );

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: "Word option not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("[LMS API] Error deleting word option:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete word option" },
      { status: 500 },
    );
  }
}
