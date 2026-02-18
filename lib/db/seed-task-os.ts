/**
 * Task OS - Seed Data Script
 * Run this to initialize departments and tracks
 */

import {
  getDepartmentsCollection,
  getTracksCollection,
  toObjectId,
} from "./task-os-db";
import { Department, Track } from "@/types/task-os";

const DEPARTMENTS_SEED: Omit<Department, "_id" | "createdAt" | "updatedAt">[] = [
  {
    name: "Graphic Design",
    slug: "graphic",
    icon: "Palette",
    color: "#8B5CF6",
    order: 1,
    isActive: true,
  },
  {
    name: "Video Editing",
    slug: "video",
    icon: "Video",
    color: "#EF4444",
    order: 2,
    isActive: true,
  },
  {
    name: "Instructor",
    slug: "instructor",
    icon: "GraduationCap",
    color: "#10B981",
    order: 3,
    isActive: true,
  },
  {
    name: "Programming",
    slug: "programming",
    icon: "Code",
    color: "#3B82F6",
    order: 4,
    isActive: true,
  },
];

const TRACKS_SEED: { name: string; slug: string; order: number }[] = [
  { name: "Corporate", slug: "corporate", order: 1 },
  { name: "Freelance", slug: "freelance", order: 2 },
];

export async function seedTaskOsData(): Promise<void> {
  try {
    const departmentsCol = await getDepartmentsCollection();
    const tracksCol = await getTracksCollection();

    // Check if already seeded
    const existingDepts = await departmentsCol.countDocuments();
    if (existingDepts > 0) {
      console.log("Task OS data already seeded. Skipping...");
      return;
    }

    console.log("Seeding Task OS data...");

    // Insert departments
    const now = new Date();
    const departmentsToInsert: Department[] = DEPARTMENTS_SEED.map((dept) => ({
      ...dept,
      createdAt: now,
      updatedAt: now,
    }));

    const deptResult = await departmentsCol.insertMany(departmentsToInsert);
    console.log(`✓ Inserted ${Object.keys(deptResult.insertedIds).length} departments`);

    // Insert tracks for each department
    const tracksToInsert: Track[] = [];
    for (const [index, dept] of departmentsToInsert.entries()) {
      const deptId = deptResult.insertedIds[index];
      
      for (const trackTemplate of TRACKS_SEED) {
        tracksToInsert.push({
          departmentId: deptId,
          name: trackTemplate.name,
          slug: trackTemplate.slug,
          order: trackTemplate.order,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    const trackResult = await tracksCol.insertMany(tracksToInsert);
    console.log(`✓ Inserted ${Object.keys(trackResult.insertedIds).length} tracks`);

    console.log("✓ Task OS data seeded successfully!");
  } catch (error) {
    console.error("Error seeding Task OS data:", error);
    throw error;
  }
}

// Run seed if called directly
if (require.main === module) {
  seedTaskOsData()
    .then(() => {
      console.log("Seed completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}
