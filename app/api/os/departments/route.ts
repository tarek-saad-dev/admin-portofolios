/**
 * Task OS - Departments API Routes
 * GET /api/os/departments - List all departments
 * POST /api/os/departments - Create new department
 */

import { NextRequest, NextResponse } from "next/server";
import { getDepartmentsCollection } from "@/lib/db/task-os-db";
import { Department, DepartmentInput } from "@/types/task-os";
import { seedTaskOsData } from "@/lib/db/seed-task-os";

// GET /api/os/departments
export async function GET() {
  try {
    const collection = await getDepartmentsCollection();
    let departments = await collection
      .find({ isActive: true })
      .sort({ order: 1 })
      .toArray();

    // Auto-seed if no departments exist
    if (departments.length === 0) {
      console.log("No departments found. Auto-seeding Task OS data...");
      await seedTaskOsData();
      departments = await collection
        .find({ isActive: true })
        .sort({ order: 1 })
        .toArray();
    }

    return NextResponse.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    console.error("Error fetching departments:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch departments",
      },
      { status: 500 },
    );
  }
}

// POST /api/os/departments
export async function POST(request: NextRequest) {
  try {
    const body: DepartmentInput = await request.json();

    // Validation
    if (!body.name || !body.slug || !body.icon) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, slug, and icon are required",
        },
        { status: 400 },
      );
    }

    const collection = await getDepartmentsCollection();

    // Check for duplicate slug
    const existing = await collection.findOne({ slug: body.slug });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Department with this slug already exists",
        },
        { status: 409 },
      );
    }

    const now = new Date();
    const department: Department = {
      name: body.name,
      slug: body.slug,
      icon: body.icon,
      color: body.color,
      order: body.order,
      isActive: body.isActive !== undefined ? body.isActive : true,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(department);
    const created = await collection.findOne({ _id: result.insertedId });

    return NextResponse.json(
      {
        success: true,
        data: created,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating department:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create department",
      },
      { status: 500 },
    );
  }
}
