/**
 * Video Project type for video portfolio management
 */
export interface VideoProject {
  id: string;
  title: string;
  category: string;
  year: string;
  duration: string;
  tools: string[];
  description: string;
  youtubeUrl: string;
  thumbnail: string | null;
  date: string;
  // MongoDB _id field (may be present in API responses)
  _id?: string;
}

/**
 * Video Project input type (for forms, without id)
 */
export type VideoProjectInput = Omit<VideoProject, "id" | "_id">;
