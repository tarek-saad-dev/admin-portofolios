import { z } from "zod";

export const CourseTypeEnum = z.enum(["GLOBAL", "CUSTOMIZE"]);
export const CourseCategoryEnum = z.enum(["programming", "design", "data"]);

export const ChallengeTypeEnum = z.enum([
  "SELECT",
  "CODE",
  "VIDEO",
  "AUDIO",
  "TEXT",
  "PDF",
  "IMAGE",
  "COMPLETE",
  "WRITE",
  "ASSIST",
  "PROJECT",
]);

export const CourseSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  imageSrc: z.string().optional(),
  category: CourseCategoryEnum.optional(),
  type: CourseTypeEnum,
  demo: z.string().optional(),
  makerId: z.string().optional(),
  price: z.number().int().min(0).default(0),
  xp: z.number().int().min(0).default(0),
  assignedTo: z.array(z.string()).default([]),
});

export const UnitSchema = z.object({
  id: z.number().optional(),
  courseId: z.number(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  order: z.number().int().min(0),
});

export const LessonSchema = z.object({
  id: z.number().optional(),
  unitId: z.number(),
  title: z.string().min(1, "Title is required"),
  order: z.number().int().min(0),
});

export const ChallengeSchema = z.object({
  id: z.number().optional(),
  lessonId: z.number(),
  type: ChallengeTypeEnum,
  label: z.string().min(1, "Label is required"),
  order: z.number().int().min(0).default(0),
  explanation: z.string().optional(),
  textContent: z.string().optional(),
  imageContent: z.string().optional(),
  videoUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  pdfUrl: z.string().optional(),
  initialCode: z.string().optional(),
  language: z.string().optional(),
  instructions: z.string().optional(),
  testCases: z.any().optional(),
  timeLimit: z.number().optional(),
  memoryLimit: z.number().optional(),
  completeQuestion: z.string().optional(),
  projectStructure: z.any().optional(),
  projectFiles: z.any().optional(),
  projectTestCases: z.any().optional(),
  testSetup: z.string().optional(),
  testTeardown: z.string().optional(),
  webViewContent: z.string().optional(),
});

export const QuizOptionSchema = z.object({
  id: z.number().optional(),
  challengeId: z.number(),
  text: z.string().min(1, "Text is required"),
  correct: z.boolean(),
  order: z.number().int().min(0).optional(),
  imageSrc: z.string().optional(),
  audioSrc: z.string().optional(),
});

export const WordOptionSchema = z.object({
  id: z.number().optional(),
  challengeId: z.number(),
  word: z.string().min(1, "Word is required"),
  order: z.number().int().min(0),
  correctPlacement: z.number().int().optional(),
});

export const LessonChallengeSchema = z.object({
  id: z.number().optional(),
  lessonId: z.number(),
  challengeId: z.number(),
  order: z.number().int().min(0),
});

export const UserProgressSchema = z.object({
  id: z.number().optional(),
  userId: z.string().min(1, "User ID is required"),
  activeCourseId: z.number().optional(),
  hearts: z.number().int().min(0).default(5),
  points: z.number().int().min(0).default(0),
  coins: z.number().int().min(0).default(0),
});

export const ChallengeProgressSchema = z.object({
  id: z.number().optional(),
  userId: z.string().min(1, "User ID is required"),
  challengeId: z.number(),
  completed: z.boolean().default(false),
});

export const ReorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.number(),
      order: z.number().int().min(0),
    }),
  ),
});

export const AssignUsersSchema = z.object({
  courseId: z.number(),
  userIds: z.array(z.string().min(1)),
});

export type CourseInput = z.infer<typeof CourseSchema>;
export type UnitInput = z.infer<typeof UnitSchema>;
export type LessonInput = z.infer<typeof LessonSchema>;
export type ChallengeInput = z.infer<typeof ChallengeSchema>;
export type QuizOptionInput = z.infer<typeof QuizOptionSchema>;
export type WordOptionInput = z.infer<typeof WordOptionSchema>;
export type LessonChallengeInput = z.infer<typeof LessonChallengeSchema>;
export type UserProgressInput = z.infer<typeof UserProgressSchema>;
export type ChallengeProgressInput = z.infer<typeof ChallengeProgressSchema>;
export type ReorderInput = z.infer<typeof ReorderSchema>;
export type AssignUsersInput = z.infer<typeof AssignUsersSchema>;
