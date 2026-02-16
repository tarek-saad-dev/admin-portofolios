/**
 * Image metadata interface for GD projects
 */
export interface ImageMetadata {
  url: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  order?: number;
  publicId?: string; // Cloudinary public ID for deletion
}

/**
 * Cover image interface (no order or caption)
 */
export interface CoverImage {
  url: string;
  alt: string;
  width: number;
  height: number;
  publicId?: string; // Cloudinary public ID for deletion
}

/**
 * Gallery interface for GD projects
 */
export interface Gallery {
  sliderImages: ImageMetadata[];
  verticalImages: ImageMetadata[];
}

/**
 * GD Project interface matching backend schema
 */
export interface GDProject {
  slug: string;
  title: string;
  category: string;
  shortDescription: string;
  story: string;
  year: number;
  role: string;
  tools: string[];
  tags: string[];
  coverImage: CoverImage;
  gallery: Gallery;
  mockups: ImageMetadata[];
  isFeatured: boolean;
  status: "draft" | "published";
  createdAt?: string;
  updatedAt?: string;
  _id?: string;
}

/**
 * GD Project input type (for create/update forms)
 */
export type GDProjectInput = Omit<GDProject, "_id" | "createdAt" | "updatedAt">;

/**
 * List query parameters
 */
export interface GDProjectListParams {
  includeDraft?: boolean;
  category?: string;
  q?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

/**
 * API response type for list endpoint
 */
export interface GDProjectListResponse {
  data: GDProject[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  categories?: string[];
}

/**
 * Type guard to check if response is an object with data property
 */
export function isGDProjectListResponse(
  response: unknown,
): response is GDProjectListResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "data" in response &&
    Array.isArray((response as GDProjectListResponse).data)
  );
}
