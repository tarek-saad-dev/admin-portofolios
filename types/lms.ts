export type CourseType = "GLOBAL" | "CUSTOMIZE";
export type CourseCategory = "programming" | "design" | "data";

export type ChallengeType =
  | "SELECT"
  | "CODE"
  | "VIDEO"
  | "AUDIO"
  | "TEXT"
  | "PDF"
  | "IMAGE"
  | "COMPLETE"
  | "WRITE"
  | "ASSIST"
  | "PROJECT";

export interface Course {
  id: number;
  title: string;
  description?: string;
  image_src?: string;
  category?: CourseCategory;
  type: CourseType;
  demo?: string;
  maker_id?: string;
  assigned_to?: string[];
  price?: number;
  xp?: number;
}

export interface Unit {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  order: number;
}

export interface Lesson {
  id: number;
  unit_id: number;
  title: string;
  order: number;
}

export interface Challenge {
  id: number;
  lesson_id: number;
  type: ChallengeType;
  label: string;
  order: number;
  explanation?: string;
  text_content?: string;
  image_content?: string;
  video_url?: string;
  audio_url?: string;
  pdf_url?: string;
  initial_code?: string;
  language?: string;
  instructions?: string;
  test_cases?: any;
  time_limit?: number;
  memory_limit?: number;
  complete_question?: string;
  project_structure?: any;
  project_files?: any;
  project_test_cases?: any;
  test_setup?: string;
  test_teardown?: string;
  web_view_content?: string;
}

export interface QuizOption {
  id: number;
  challenge_id: number;
  text: string;
  correct: boolean;
  order?: number;
  image_src?: string;
  audio_src?: string;
}

export interface WordOption {
  id: number;
  challenge_id: number;
  word: string;
  order: number;
  correct: boolean;
  correct_placement?: number;
}

export interface LessonChallenge {
  id: number;
  lesson_id: number;
  challenge_id: number;
  order: number;
}

export interface ChallengeProgress {
  id: number;
  user_id: string;
  challenge_id: number;
  completed: boolean;
}

export interface UserProgress {
  id: number;
  user_id: string;
  active_course_id?: number;
  hearts: number;
  points: number;
  coins: number;
}

export interface CourseWithStats extends Course {
  unitCount?: number;
  lessonCount?: number;
  challengeCount?: number;
}

export interface UnitWithLessons extends Unit {
  lessons?: Lesson[];
}

export interface LessonWithChallenges extends Lesson {
  challenges?: (Challenge & { lessonChallengeId: number; order: number })[];
}

export interface UserProgressWithDetails extends UserProgress {
  activeCourse?: Course;
  completedChallenges?: number;
  totalChallenges?: number;
}
