import { GDProject, GDProjectInput, GDProjectListParams } from "@/types/gd-project";

const BASE_URL = "https://portfolio-graphic-server.vercel.app/api/gd/projects";

/**
 * Build query string from params
 */
function buildQueryString(params: GDProjectListParams): string {
  const searchParams = new URLSearchParams();
  
  if (params.includeDraft !== undefined) {
    searchParams.append("includeDraft", String(params.includeDraft));
  }
  if (params.category) {
    searchParams.append("category", params.category);
  }
  if (params.q) {
    searchParams.append("q", params.q);
  }
  if (params.sort) {
    searchParams.append("sort", params.sort);
  }
  if (params.page !== undefined) {
    searchParams.append("page", String(params.page));
  }
  if (params.limit !== undefined) {
    searchParams.append("limit", String(params.limit));
  }
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * List all GD projects with optional filters
 */
export async function listGDProjects(params: GDProjectListParams = {}): Promise<GDProject[]> {
  const queryString = buildQueryString(params);
  const response = await fetch(`${BASE_URL}${queryString}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to fetch projects" }));
    throw new Error(error.message || "Failed to fetch projects");
  }
  
  return response.json();
}

/**
 * Get a single GD project by slug
 */
export async function getGDProject(slug: string, includeDraft: boolean = true): Promise<GDProject> {
  const queryString = includeDraft ? "?includeDraft=true" : "";
  const response = await fetch(`${BASE_URL}/${slug}${queryString}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to fetch project" }));
    throw new Error(error.message || "Failed to fetch project");
  }
  
  return response.json();
}

/**
 * Create a new GD project
 */
export async function createGDProject(project: GDProjectInput): Promise<GDProject> {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(project),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to create project" }));
    throw new Error(error.message || "Failed to create project");
  }
  
  return response.json();
}

/**
 * Update an existing GD project
 */
export async function updateGDProject(slug: string, project: GDProjectInput): Promise<GDProject> {
  const response = await fetch(`${BASE_URL}/${slug}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(project),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to update project" }));
    throw new Error(error.message || "Failed to update project");
  }
  
  return response.json();
}

/**
 * Delete a GD project
 */
export async function deleteGDProject(slug: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/${slug}`, {
    method: "DELETE",
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to delete project" }));
    throw new Error(error.message || "Failed to delete project");
  }
}

/**
 * Toggle project status (draft <-> published)
 */
export async function toggleGDProjectStatus(slug: string, currentStatus: "draft" | "published"): Promise<GDProject> {
  const project = await getGDProject(slug);
  const newStatus = currentStatus === "draft" ? "published" : "draft";
  
  return updateGDProject(slug, {
    ...project,
    status: newStatus,
  });
}

/**
 * Toggle featured status
 */
export async function toggleGDProjectFeatured(slug: string, currentFeatured: boolean): Promise<GDProject> {
  const project = await getGDProject(slug);
  
  return updateGDProject(slug, {
    ...project,
    isFeatured: !currentFeatured,
  });
}
