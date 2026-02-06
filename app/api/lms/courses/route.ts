import { NextRequest, NextResponse } from "next/server";
import { query, transaction } from "@/lib/lms-db";
import { CourseSchema } from "@/lib/lms-validation";
import { Course, CourseWithStats } from "@/types/lms";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");
    const category = searchParams.get("category");
    const isFree = searchParams.get("isFree");
    const assignedTo = searchParams.get("assignedTo");
    const search = searchParams.get("search");

    if (id) {
      const numericId = Number(id);
      if (!Number.isInteger(numericId) || numericId <= 0) {
        return NextResponse.json(
          { success: false, error: "Invalid course ID" },
          { status: 400 },
        );
      }

      const courses = await query<Course>(
        "SELECT * FROM courses WHERE id = $1",
        [numericId],
      );

      return NextResponse.json({
        success: true,
        data: courses,
      });
    }

    let sql = `
      SELECT 
        c.*,
        COUNT(DISTINCT u.id) as "unitCount",
        COUNT(DISTINCT l.id) as "lessonCount",
        COUNT(DISTINCT lc.challenge_id) as "challengeCount"
      FROM courses c
      LEFT JOIN units u ON u.course_id = c.id
      LEFT JOIN lessons l ON l.unit_id = u.id
      LEFT JOIN lesson_challenges lc ON lc.lesson_id = l.id
      WHERE 1=1
    `;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (type) {
      sql += ` AND c.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (category) {
      sql += ` AND c.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (isFree !== null && isFree !== undefined) {
      sql += ` AND c.is_free = $${paramIndex}`;
      params.push(isFree === "true");
      paramIndex++;
    }

    if (assignedTo) {
      sql += ` AND $${paramIndex} = ANY(c.assigned_to)`;
      params.push(assignedTo);
      paramIndex++;
    }

    if (search) {
      sql += ` AND (c.title ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sql += ` GROUP BY c.id ORDER BY c.id DESC`;

    const courses = await query<CourseWithStats>(sql, params);

    return NextResponse.json({
      success: true,
      data: courses.map((course) => ({
        ...course,
        assigned_to: course.assigned_to || [],
        unitCount: Number(course.unitCount || 0),
        lessonCount: Number(course.lessonCount || 0),
        challengeCount: Number(course.challengeCount || 0),
        image_src: course.image_src || null,
        price: Number(course.price || 0),
        xp: Number(course.xp || 0),
      })),
    });
  } catch (error) {
    console.error("[LMS API] Error fetching courses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch courses" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CourseSchema.parse(body);

    // Normalize and validate category enum
    const categoryRaw = validatedData.category || "programming";
    const category = String(categoryRaw).trim().toLowerCase();
    if (!["programming", "design", "data"].includes(category)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid category. Must be one of: programming, design, data`,
        },
        { status: 400 },
      );
    }

    // Validate type enum
    const type = validatedData.type;
    if (!["GLOBAL", "CUSTOMIZE"].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid type. Must be one of: GLOBAL, CUSTOMIZE`,
        },
        { status: 400 },
      );
    }

    const result = await query<Course>(
      `INSERT INTO courses (title, description, image_src, category, type, price, xp, assigned_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        validatedData.title,
        validatedData.description || "",
        validatedData.imageSrc || "",
        category,
        type,
        validatedData.price || 0,
        validatedData.xp || 0,
        validatedData.assignedTo || [],
      ],
    );

    console.log("[LMS API] Course created:", result[0]);

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("[LMS API] Error creating course:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create course",
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
        { success: false, error: "Course ID is required" },
        { status: 400 },
      );
    }

    const validatedData = CourseSchema.partial().parse(updateData);

    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (validatedData.title !== undefined) {
      setClauses.push(`title = $${paramIndex}`);
      params.push(validatedData.title);
      paramIndex++;
    }
    if (validatedData.description !== undefined) {
      setClauses.push(`description = $${paramIndex}`);
      params.push(validatedData.description || "");
      paramIndex++;
    }
    if (validatedData.imageSrc !== undefined) {
      setClauses.push(`image_src = $${paramIndex}`);
      params.push(validatedData.imageSrc || "");
      paramIndex++;
    }
    if (validatedData.category !== undefined) {
      // Normalize category to lowercase
      const category = String(validatedData.category).trim().toLowerCase();
      if (!["programming", "design", "data"].includes(category)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid category. Must be one of: programming, design, data`,
          },
          { status: 400 },
        );
      }
      setClauses.push(`category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }
    if (validatedData.type !== undefined) {
      // Validate type enum
      if (!["GLOBAL", "CUSTOMIZE"].includes(validatedData.type)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid type. Must be one of: GLOBAL, CUSTOMIZE`,
          },
          { status: 400 },
        );
      }
      setClauses.push(`type = $${paramIndex}`);
      params.push(validatedData.type);
      paramIndex++;
    }
    if (validatedData.price !== undefined) {
      setClauses.push(`price = $${paramIndex}`);
      params.push(validatedData.price);
      paramIndex++;
    }
    if (validatedData.xp !== undefined) {
      setClauses.push(`xp = $${paramIndex}`);
      params.push(validatedData.xp);
      paramIndex++;
    }
    if (validatedData.assignedTo !== undefined) {
      setClauses.push(`assigned_to = $${paramIndex}`);
      params.push(validatedData.assignedTo);
      paramIndex++;
    }

    params.push(id);

    const result = await query<Course>(
      `UPDATE courses SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      params,
    );

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 },
      );
    }

    console.log("[LMS API] Course updated:", result[0]);

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("[LMS API] Error updating course:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update course",
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
        { success: false, error: "Course ID is required" },
        { status: 400 },
      );
    }

    const stats = await transaction(async (client) => {
      const courseResult = await client.query(
        "SELECT * FROM courses WHERE id = $1",
        [id],
      );

      if (courseResult.rows.length === 0) {
        throw new Error("Course not found");
      }

      const unitsResult = await client.query(
        "SELECT COUNT(*) as count FROM units WHERE course_id = $1",
        [id],
      );
      const lessonsResult = await client.query(
        "SELECT COUNT(*) as count FROM lessons l JOIN units u ON l.unit_id = u.id WHERE u.course_id = $1",
        [id],
      );
      const challengesResult = await client.query(
        `SELECT COUNT(DISTINCT lc.challenge_id) as count 
         FROM lesson_challenges lc 
         JOIN lessons l ON lc.lesson_id = l.id 
         JOIN units u ON l.unit_id = u.id 
         WHERE u.course_id = $1`,
        [id],
      );

      const stats = {
        units: parseInt(unitsResult.rows[0].count),
        lessons: parseInt(lessonsResult.rows[0].count),
        challenges: parseInt(challengesResult.rows[0].count),
      };

      await client.query("DELETE FROM courses WHERE id = $1", [id]);

      return stats;
    });

    console.log("[LMS API] Course deleted:", { id, stats });

    return NextResponse.json({
      success: true,
      data: { id, stats },
    });
  } catch (error) {
    console.error("[LMS API] Error deleting course:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete course",
      },
      { status: 400 },
    );
  }
}
