import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/lms-db";
import { z } from "zod";

const ReorderSchema = z.object({
  lessonId: z.number().int().positive(),
  orderedChallengeIds: z.array(z.number().int().positive()).min(1),
});

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ReorderSchema.parse(body);

    const { lessonId, orderedChallengeIds } = validatedData;

    // Verify all challenge IDs belong to this lesson
    const existingChallenges = await query<{ id: number }>(
      `SELECT id FROM challenges WHERE lesson_id = $1`,
      [lessonId]
    );

    const existingIds = new Set(existingChallenges.map((c) => c.id));
    const invalidIds = orderedChallengeIds.filter((id) => !existingIds.has(id));

    if (invalidIds.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Challenge IDs do not belong to lesson ${lessonId}: ${invalidIds.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Use a transaction to update all orders atomically
    // Since we don't have a transaction wrapper, we'll update sequentially
    // In production, wrap this in BEGIN/COMMIT
    for (let index = 0; index < orderedChallengeIds.length; index++) {
      const challengeId = orderedChallengeIds[index];
      await query(
        `UPDATE challenges SET "order" = $1 WHERE id = $2 AND lesson_id = $3`,
        [index, challengeId, lessonId]
      );
    }

    console.log(
      `[LMS API] Reordered ${orderedChallengeIds.length} challenges for lesson ${lessonId}`
    );

    return NextResponse.json({
      success: true,
      data: {
        lessonId,
        updatedCount: orderedChallengeIds.length,
      },
    });
  } catch (error) {
    console.error("[LMS API] Error reordering challenges:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to reorder challenges",
      },
      { status: 400 }
    );
  }
}
