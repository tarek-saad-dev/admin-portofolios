import { VideoProject } from "@/types/video-project";

/**
 * Normalizes a video project object from API response to ensure all required fields exist
 * and handles legacy fields (e.g., _id -> id)
 */
export function normalizeVideoProject(project: any): VideoProject {
  // Handle MongoDB _id field - convert to id if id doesn't exist
  let id = project.id ?? project._id;
  
  // If id is still undefined/null, generate a temporary string ID
  if (id === null || id === undefined) {
    id = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Ensure id is a string
  const normalizedId = String(id);

  // Normalize tools array
  let tools: string[] = [];
  if (Array.isArray(project.tools)) {
    tools = project.tools.map(String).filter((tool: string) => tool.trim().length > 0);
  } else if (typeof project.tools === 'string') {
    // Handle comma-separated string
    tools = project.tools
      .split(',')
      .map((tool: string) => tool.trim())
      .filter((tool: string) => tool.length > 0);
  }

  return {
    id: normalizedId,
    title: String(project.title ?? 'Untitled Video'),
    category: String(project.category ?? ''),
    year: String(project.year ?? new Date().getFullYear().toString()),
    duration: String(project.duration ?? '00:00'),
    tools: tools,
    description: String(project.description ?? ''),
    youtubeUrl: String(project.youtubeUrl ?? ''),
    thumbnail: project.thumbnail ? String(project.thumbnail) : null,
    // Preserve _id if present
    _id: project._id ? String(project._id) : undefined,
  };
}

/**
 * Normalizes an array of video projects from API response
 */
export function normalizeVideoProjects(projects: any[]): VideoProject[] {
  if (!Array.isArray(projects)) {
    console.warn('normalizeVideoProjects: Expected array but got', typeof projects);
    return [];
  }
  
  return projects.map(normalizeVideoProject);
}

