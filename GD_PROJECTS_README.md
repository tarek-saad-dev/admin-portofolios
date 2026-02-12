# Graphic Design Projects Admin Module

## Overview

A complete admin module for managing Behance-style Graphic Design portfolio projects with full CRUD operations, drag-and-drop gallery builder, and comprehensive project management features.

## Features

### ✅ Project Management
- **Create/Edit/Delete** GD projects with full validation
- **Status Management**: Draft ↔ Published toggle
- **Featured Projects**: Star/unstar projects for homepage prominence
- **Auto-slug Generation**: Automatic kebab-case slug from title with manual override
- **Unsaved Changes Warning**: Prevents accidental data loss

### ✅ Rich Content Editor
- **Cover Image**: Required thumbnail with URL, alt text, dimensions
- **Gallery Builder** with 3 tabs:
  - **Slider Images**: Carousel/hero images
  - **Vertical Flow**: Full-width stacked images
  - **Mockups**: Device mockups in grid layout
- **Drag & Drop Reordering**: Visual reordering of all gallery images
- **Live Image Previews**: Real-time preview of all images

### ✅ Metadata & Organization
- **Tags**: Chip-based input for project tags
- **Tools**: Chip-based input for tools used
- **Categories**: Flexible categorization
- **Year**: Project year (2000-2100)
- **Role**: Designer's role in the project
- **Descriptions**: Short description + full story

### ✅ Advanced Filtering & Search
- **Search**: Full-text search across title, tags, category
- **Category Filter**: Filter by project category
- **Status Filter**: All / Published / Draft
- **Sort Options**: Newest / Oldest / A-Z
- **Real-time Filtering**: Instant results as you type

### ✅ Professional UI/UX
- **Table View**: Comprehensive project list with thumbnails
- **Quick Actions**: Edit, Delete, Status toggle, Featured toggle
- **Confirmation Dialogs**: Safe delete with confirmation
- **Toast Notifications**: Success/error feedback
- **Loading States**: Smooth loading indicators
- **Responsive Design**: Works on all screen sizes

## Architecture

### File Structure

```
app/
├── admin/
│   ├── gd-projects/
│   │   ├── page.tsx                    # Project list page
│   │   ├── new/
│   │   │   └── page.tsx                # Create new project
│   │   └── [slug]/
│   │       └── edit/
│   │           └── page.tsx            # Edit existing project
│   └── dashboard/
│       └── page.tsx                    # Admin hub (optional)

components/
├── gd-projects/
│   ├── chips-input.tsx                 # Tag/tool chip input
│   ├── image-editor.tsx                # Single image editor
│   ├── sortable-image-list.tsx         # Drag-drop image list
│   ├── gallery-builder.tsx             # Gallery tabs component
│   └── project-form.tsx                # Main project form

services/
└── gd-project-service.ts               # API client

types/
└── gd-project.ts                       # TypeScript interfaces

components/ui/
└── switch.tsx                          # Switch component (added)
```

## Data Model

### GDProject Interface

```typescript
interface GDProject {
  slug: string                          // Unique identifier (kebab-case)
  title: string                         // Project title
  category: string                      // Category (e.g., "Branding")
  shortDescription: string              // 1-2 line description
  story: string                         // Full project story (3-8 lines)
  year: number                          // Project year (2000-2100)
  role: string                          // Designer's role
  tools: string[]                       // Tools used
  tags: string[]                        // Project tags
  coverImage: CoverImage                // Thumbnail image
  gallery: {
    sliderImages: ImageMetadata[]       // Carousel images
    verticalImages: ImageMetadata[]     // Stacked images
  }
  mockups: ImageMetadata[]              // Mockup images
  isFeatured: boolean                   // Featured flag
  status: "draft" | "published"         // Publication status
  createdAt?: string
  updatedAt?: string
}
```

### ImageMetadata Interface

```typescript
interface ImageMetadata {
  url: string                           // Image URL
  alt: string                           // Alt text (accessibility)
  width: number                         // Image width in pixels
  height: number                        // Image height in pixels
  caption?: string                      // Optional caption
  order?: number                        // Display order
}
```

## API Integration

### Backend Endpoints

Base URL: `https://portfolio-graphic-server.vercel.app/api/gd/projects`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all projects (with filters) |
| GET | `/:slug` | Get single project by slug |
| POST | `/` | Create new project |
| PUT | `/:slug` | Update existing project |
| DELETE | `/:slug` | Delete project |

### Query Parameters

- `includeDraft=true` - Include draft projects
- `category=Branding` - Filter by category
- `q=search+term` - Search query
- `sort=newest` - Sort order
- `page=1` - Page number
- `limit=20` - Items per page

## Validation Rules

### Required Fields
- ✅ Title
- ✅ Slug (must match: `^[a-z0-9]+(?:-[a-z0-9]+)*$`)
- ✅ Category
- ✅ Year (2000-2100)
- ✅ Role
- ✅ Short Description
- ✅ Story
- ✅ Cover Image (url, alt, width, height)
- ✅ At least 1 slider image OR 1 vertical image

### Optional Fields
- Tags (array)
- Tools (array)
- Mockups (array)
- Caption for gallery images
- Featured flag
- Status (defaults to "draft")

## Usage Guide

### Creating a New Project

1. Navigate to `/admin/gd-projects`
2. Click "New Project" button
3. Fill in basic information:
   - Title (slug auto-generates)
   - Category, Year, Role
   - Short description and story
   - Add tags and tools using chip input
4. Upload cover image with dimensions
5. Build gallery:
   - Add slider images (carousel)
   - Add vertical images (stacked)
   - Add mockups (optional)
   - Drag to reorder images
6. Set publishing options:
   - Status: Draft or Published
   - Featured: Toggle on/off
7. Click "Save Project"

### Editing a Project

1. Navigate to `/admin/gd-projects`
2. Click edit icon on project row
3. Modify any fields
4. Gallery images can be:
   - Reordered via drag & drop
   - Added with "Add Image" button
   - Removed with trash icon
5. Click "Save Project"

### Deleting a Project

1. Click trash icon on project row
2. Confirm deletion in dialog
3. Project is permanently deleted

### Quick Actions

- **Status Toggle**: Click status badge to toggle draft ↔ published
- **Featured Toggle**: Click star icon to toggle featured status

## Components Reference

### ChipsInput
Allows adding/removing tags or tools with keyboard shortcuts.
- Press Enter or comma to add
- Press Backspace to remove last item
- Click X to remove specific item

### ImageEditor
Single image editor with live preview.
- URL, alt text, width, height inputs
- Optional caption field
- Real-time image preview
- Error handling for invalid URLs

### SortableImageList
Drag-and-drop sortable list of images.
- Drag handle for reordering
- Individual image editors
- Add/remove buttons
- Auto-updates order field

### GalleryBuilder
Tabbed interface for managing all gallery content.
- Slider Images tab
- Vertical Flow tab
- Mockups tab
- Validation warnings

### ProjectForm
Main form component with all project fields.
- Auto-save warning on navigation
- Real-time validation
- Sticky save button
- Loading states

## Technical Details

### Dependencies
- `@dnd-kit/core` - Drag and drop functionality
- `@dnd-kit/sortable` - Sortable lists
- `@radix-ui/react-switch` - Switch component
- `@radix-ui/react-tabs` - Tabs component
- `next` - Next.js framework
- `react` - React library

### State Management
- Local component state with React hooks
- No external state management library
- API calls via service layer

### Routing
- Next.js App Router (app directory)
- Dynamic routes for edit pages: `[slug]/edit`
- Client-side navigation with `next/link`

## Troubleshooting

### Images not loading
- Verify image URLs are accessible
- Check CORS settings on image host
- Ensure dimensions are correct

### Slug validation errors
- Slug must be lowercase
- Only letters, numbers, and hyphens
- No spaces or special characters
- Cannot start/end with hyphen

### Gallery validation errors
- Must have at least 1 slider OR 1 vertical image
- All image fields (url, alt, width, height) are required
- Order is auto-computed, don't set manually

### API errors
- Check backend server is running
- Verify API base URL is correct
- Check network tab for detailed errors
- Ensure request payload matches schema

## Future Enhancements

- [ ] Bulk operations (delete multiple, bulk publish)
- [ ] Image upload integration (vs. URL input)
- [ ] Rich text editor for story field
- [ ] Project duplication
- [ ] Export/import functionality
- [ ] Activity log/version history
- [ ] Collaborative editing
- [ ] Image optimization
- [ ] SEO metadata fields

## Navigation

Access the GD Projects module:
- From main dashboard: `/` → Admin Dashboard → Graphic Design Projects
- Direct link: `/admin/gd-projects`
- Create new: `/admin/gd-projects/new`
- Edit existing: `/admin/gd-projects/[slug]/edit`

## Support

For issues or questions:
1. Check validation messages in UI
2. Review browser console for errors
3. Verify API responses in Network tab
4. Check this README for guidance
