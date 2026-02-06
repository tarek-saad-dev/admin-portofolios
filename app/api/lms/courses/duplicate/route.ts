import { NextRequest, NextResponse } from "next/server";
import { transaction } from "@/lib/lms-db";

export async function POST(request: NextRequest) {
  try {
    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: "Course ID is required" },
        { status: 400 },
      );
    }

    const newCourse = await transaction(async (client) => {
      const courseResult = await client.query(
        "SELECT * FROM courses WHERE id = $1",
        [courseId],
      );

      if (courseResult.rows.length === 0) {
        throw new Error("Course not found");
      }

      const originalCourse = courseResult.rows[0];

      // Normalize category to lowercase
      const category = originalCourse.category
        ? String(originalCourse.category).trim().toLowerCase()
        : "programming";
      if (!["programming", "design", "data"].includes(category)) {
        throw new Error(`Invalid category: ${category}`);
      }

      // Validate type
      const type = originalCourse.type || "GLOBAL";
      if (!["GLOBAL", "CUSTOMIZE"].includes(type)) {
        throw new Error(`Invalid type: ${type}`);
      }

      const newCourseResult = await client.query(
        `INSERT INTO courses (title, description, image_src, category, type, price, xp, assigned_to)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          `${originalCourse.title} (Copy)`,
          originalCourse.description,
          originalCourse.image_src,
          category,
          type,
          originalCourse.price || 0,
          originalCourse.xp || 0,
          originalCourse.assigned_to || [],
        ],
      );

      const newCourseId = newCourseResult.rows[0].id;

      const unitsResult = await client.query(
        'SELECT * FROM units WHERE course_id = $1 ORDER BY "order"',
        [courseId],
      );

      const unitIdMap = new Map<number, number>();

      for (const unit of unitsResult.rows) {
        const newUnitResult = await client.query(
          `INSERT INTO units (course_id, title, description, "order")
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [newCourseId, unit.title, unit.description, unit.order],
        );
        unitIdMap.set(unit.id, newUnitResult.rows[0].id);
      }

      const lessonIdMap = new Map<number, number>();

      for (const [oldUnitId, newUnitId] of unitIdMap.entries()) {
        const lessonsResult = await client.query(
          'SELECT * FROM lessons WHERE unit_id = $1 ORDER BY "order"',
          [oldUnitId],
        );

        for (const lesson of lessonsResult.rows) {
          const newLessonResult = await client.query(
            `INSERT INTO lessons (unit_id, title, "order")
             VALUES ($1, $2, $3)
             RETURNING *`,
            [newUnitId, lesson.title, lesson.order],
          );
          lessonIdMap.set(lesson.id, newLessonResult.rows[0].id);
        }
      }

      const challengeIdMap = new Map<number, number>();

      for (const [oldLessonId, newLessonId] of lessonIdMap.entries()) {
        const lessonChallengesResult = await client.query(
          'SELECT * FROM lesson_challenges WHERE lesson_id = $1 ORDER BY "order"',
          [oldLessonId],
        );

        for (const lc of lessonChallengesResult.rows) {
          let newChallengeId = challengeIdMap.get(lc.challenge_id);

          if (!newChallengeId) {
            const challengeResult = await client.query(
              "SELECT * FROM challenges WHERE id = $1",
              [lc.challenge_id],
            );

            if (challengeResult.rows.length > 0) {
              const challenge = challengeResult.rows[0];
              const newChallengeResult = await client.query(
                `INSERT INTO challenges (type, prompt, question, language, starter_code, instructions, test_cases, url, content, project_metadata, files_structure, tests, rubric)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                 RETURNING *`,
                [
                  challenge.type,
                  challenge.prompt,
                  challenge.question,
                  challenge.language,
                  challenge.starter_code,
                  challenge.instructions,
                  challenge.test_cases,
                  challenge.url,
                  challenge.content,
                  challenge.project_metadata,
                  challenge.files_structure,
                  challenge.tests,
                  challenge.rubric,
                ],
              );
              newChallengeId = newChallengeResult.rows[0].id;
              challengeIdMap.set(lc.challenge_id, newChallengeId);

              const quizOptionsResult = await client.query(
                'SELECT * FROM quiz_options WHERE challenge_id = $1 ORDER BY "order"',
                [lc.challenge_id],
              );

              for (const option of quizOptionsResult.rows) {
                await client.query(
                  `INSERT INTO quiz_options (challenge_id, text, correct, "order", image_src, audio_src)
                   VALUES ($1, $2, $3, $4, $5, $6)`,
                  [
                    newChallengeId,
                    option.text,
                    option.correct,
                    option.order,
                    option.image_src,
                    option.audio_src,
                  ],
                );
              }

              const wordOptionsResult = await client.query(
                'SELECT * FROM word_options WHERE challenge_id = $1 ORDER BY "order"',
                [lc.challenge_id],
              );

              for (const option of wordOptionsResult.rows) {
                await client.query(
                  `INSERT INTO word_options (challenge_id, word, "order", correct_placement)
                   VALUES ($1, $2, $3, $4)`,
                  [
                    newChallengeId,
                    option.word,
                    option.order,
                    option.correct_placement,
                  ],
                );
              }
            }
          }

          if (newChallengeId) {
            await client.query(
              `INSERT INTO lesson_challenges (lesson_id, challenge_id, "order")
               VALUES ($1, $2, $3)`,
              [newLessonId, newChallengeId, lc.order],
            );
          }
        }
      }

      return newCourseResult.rows[0];
    });

    console.log("[LMS API] Course duplicated:", {
      originalId: courseId,
      newId: newCourse.id,
    });

    return NextResponse.json({
      success: true,
      data: newCourse,
    });
  } catch (error) {
    console.error("[LMS API] Error duplicating course:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to duplicate course",
      },
      { status: 400 },
    );
  }
}
