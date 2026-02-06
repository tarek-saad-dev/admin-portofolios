import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/lms-db';
import { LessonChallengeSchema, ReorderSchema } from '@/lib/lms-validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.action === 'reorder') {
      const validatedData = ReorderSchema.parse(body);
      
      await transaction(async (client) => {
        for (const item of validatedData.items) {
          await client.query(
            'UPDATE lesson_challenges SET "order" = $1 WHERE id = $2',
            [item.order, item.id]
          );
        }
      });

      console.log('[LMS API] Lesson challenges reordered:', validatedData.items.length);

      return NextResponse.json({
        success: true,
        data: { reordered: validatedData.items.length }
      });
    }

    const validatedData = LessonChallengeSchema.parse(body);

    const result = await query(
      `INSERT INTO lesson_challenges (lesson_id, challenge_id, "order")
       VALUES ($1, $2, $3)
       RETURNING *`,
      [
        validatedData.lessonId,
        validatedData.challengeId,
        validatedData.order
      ]
    );

    console.log('[LMS API] Challenge attached to lesson:', result[0]);

    return NextResponse.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('[LMS API] Error attaching challenge:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to attach challenge' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Lesson challenge ID is required' },
        { status: 400 }
      );
    }

    await query('DELETE FROM lesson_challenges WHERE id = $1', [id]);

    console.log('[LMS API] Challenge detached from lesson:', id);

    return NextResponse.json({
      success: true,
      data: { id }
    });
  } catch (error) {
    console.error('[LMS API] Error detaching challenge:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to detach challenge' },
      { status: 500 }
    );
  }
}
