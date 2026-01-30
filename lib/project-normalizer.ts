import { Project } from "@/components/portfolio-selector";

/**
 * Normalizes a project object from API response to ensure all required fields exist
 * and handles legacy fields (e.g., _id -> id)
 */
export function normalizeProject(project: any): Project {
  // Handle MongoDB _id field - convert to id if id doesn't exist
  let id = project.id ?? project._id;
  
  // If id is still undefined/null, generate a temporary numeric ID
  if (id === null || id === undefined) {
    id = Date.now();
  }
  
  // Convert id to number if it's a string that represents a number
  // For MongoDB ObjectIds or other non-numeric strings, use a hash
  let normalizedId: number | string;
  if (typeof id === 'number') {
    normalizedId = id;
  } else if (typeof id === 'string') {
    // Try to parse as number if it's numeric
    if (/^\d+$/.test(id)) {
      normalizedId = parseInt(id, 10);
    } else {
      // For non-numeric strings (like MongoDB ObjectIds), create a numeric hash
      // This ensures consistent rendering and avoids toString() errors
      let hash = 0;
      for (let i = 0; i < id.length; i++) {
        const char = id.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      normalizedId = Math.abs(hash) || Date.now();
    }
  } else {
    // Fallback for any other type
    normalizedId = Date.now();
  }

  return {
    id: normalizedId,
    title: String(project.title ?? 'Untitled Project'),
    description: String(project.description ?? ''),
    imgPath: String(project.imgPath ?? project.thumbnail ?? '/Assets/Projects/default.png'),
    imagePaths: Array.isArray(project.imagePaths) ? project.imagePaths : [],
    ghLink: String(project.ghLink ?? ''),
    demoLink: project.demoLink ? String(project.demoLink) : undefined,
    skills: Array.isArray(project.skills) ? project.skills.map(String) : [],
    technologies: Array.isArray(project.technologies) ? project.technologies.map(String) : [],
    tools: Array.isArray(project.tools) ? project.tools.map(String) : [],
    keyFeatures: Array.isArray(project.keyFeatures) ? project.keyFeatures.map(String) : [],
    date: String(project.date ?? new Date().toISOString().split('T')[0]),
    views: typeof project.views === 'number' ? project.views : (project.views ? parseInt(String(project.views), 10) : 0),
    // New schema fields
    category: project.category ? String(project.category) : undefined,
    thumbnail: project.thumbnail ? String(project.thumbnail) : undefined,
    year: project.year ? String(project.year) : undefined,
    duration: project.duration ? String(project.duration) : undefined,
    youtubeUrl: project.youtubeUrl ? String(project.youtubeUrl) : undefined,
    // Preserve _id if present
    _id: project._id ? String(project._id) : undefined,
  };
}

/**
 * Normalizes an array of projects from API response
 */
export function normalizeProjects(projects: any[]): Project[] {
  if (!Array.isArray(projects)) {
    console.warn('normalizeProjects: Expected array but got', typeof projects);
    return [];
  }
  
  return projects.map(normalizeProject);
}

/**
 * Safe toString conversion that handles undefined/null values
 */
export function safeToString(value: any, defaultValue: string = ''): string {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  return String(value);
}

