"use client"

import { useState, useEffect } from "react"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { ChipsInput } from "@/components/gd-projects/chips-input"
import { ImageEditor } from "@/components/gd-projects/image-editor"
import { GalleryBuilder } from "@/components/gd-projects/gallery-builder"
import { GDProject, GDProjectInput } from "@/types/gd-project"
import { createGDProject, updateGDProject } from "@/services/gd-project-service"
import { ScrollArea } from "@/components/ui/scroll-area"

interface GDProjectFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: GDProject | null
  onSuccess: () => void
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function validateSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

export function GDProjectFormDialog({ open, onOpenChange, project, onSuccess }: GDProjectFormDialogProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const mode = project ? "edit" : "create"

  const [formData, setFormData] = useState<GDProjectInput>({
    slug: project?.slug || "",
    title: project?.title || "",
    category: project?.category || "",
    shortDescription: project?.shortDescription || "",
    story: project?.story || "",
    year: project?.year || new Date().getFullYear(),
    role: project?.role || "",
    tools: project?.tools || [],
    tags: project?.tags || [],
    coverImage: project?.coverImage || { url: "", alt: "", width: 0, height: 0 },
    // Defensive: ensure gallery always has both arrays
    gallery: {
      sliderImages: project?.gallery?.sliderImages || [],
      verticalImages: project?.gallery?.verticalImages || []
    },
    mockups: project?.mockups || [],
    isFeatured: project?.isFeatured || false,
    status: project?.status || "draft",
  })

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(mode === "edit")
  const [slugError, setSlugError] = useState("")

  useEffect(() => {
    if (project) {
      setFormData({
        slug: project.slug,
        title: project.title,
        category: project.category,
        shortDescription: project.shortDescription,
        story: project.story,
        year: project.year,
        role: project.role,
        tools: project.tools || [],
        tags: project.tags || [],
        coverImage: project.coverImage || { url: "", alt: "", width: 0, height: 0 },
        // Defensive: ensure gallery always has both arrays even if API returns incomplete data
        gallery: {
          sliderImages: project.gallery?.sliderImages || [],
          verticalImages: project.gallery?.verticalImages || []
        },
        mockups: project.mockups || [],
        isFeatured: project.isFeatured || false,
        status: project.status || "draft",
      })
      setSlugManuallyEdited(true)
    } else {
      setFormData({
        slug: "",
        title: "",
        category: "",
        shortDescription: "",
        story: "",
        year: new Date().getFullYear(),
        role: "",
        tools: [],
        tags: [],
        coverImage: { url: "", alt: "", width: 0, height: 0 },
        gallery: { sliderImages: [], verticalImages: [] },
        mockups: [],
        isFeatured: false,
        status: "draft",
      })
      setSlugManuallyEdited(false)
    }
  }, [project])

  useEffect(() => {
    if (!slugManuallyEdited && formData.title) {
      const generatedSlug = generateSlug(formData.title)
      setFormData((prev) => ({ ...prev, slug: generatedSlug }))
    }
  }, [formData.title, slugManuallyEdited])

  useEffect(() => {
    if (formData.slug) {
      if (!validateSlug(formData.slug)) {
        setSlugError("Slug must be lowercase letters, numbers, and hyphens only")
      } else {
        setSlugError("")
      }
    }
  }, [formData.slug])

  const handleChange = <K extends keyof GDProjectInput>(field: K, value: GDProjectInput[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true)
    handleChange("slug", value)
  }

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast({ title: "Validation Error", description: "Title is required", variant: "destructive" })
      return false
    }
    if (!formData.slug.trim() || !validateSlug(formData.slug)) {
      toast({ title: "Validation Error", description: "Valid slug is required", variant: "destructive" })
      return false
    }
    if (!formData.category.trim()) {
      toast({ title: "Validation Error", description: "Category is required", variant: "destructive" })
      return false
    }
    if (!formData.year || formData.year < 2000 || formData.year > 2100) {
      toast({ title: "Validation Error", description: "Year must be between 2000 and 2100", variant: "destructive" })
      return false
    }
    if (!formData.role.trim()) {
      toast({ title: "Validation Error", description: "Role is required", variant: "destructive" })
      return false
    }
    if (!formData.shortDescription.trim()) {
      toast({ title: "Validation Error", description: "Short description is required", variant: "destructive" })
      return false
    }
    if (!formData.story.trim()) {
      toast({ title: "Validation Error", description: "Story is required", variant: "destructive" })
      return false
    }
    if (!formData.coverImage.url || !formData.coverImage.alt || !formData.coverImage.width || !formData.coverImage.height) {
      toast({ title: "Validation Error", description: "Cover image with all fields is required", variant: "destructive" })
      return false
    }
    if (formData.gallery.sliderImages.length === 0 && formData.gallery.verticalImages.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one slider image OR one vertical image is required",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSaving(true)
    try {
      // Sanitize arrays: filter out items with missing url
      const sanitizedGallery = {
        sliderImages: formData.gallery.sliderImages.filter(img => img.url && img.url.trim()),
        verticalImages: formData.gallery.verticalImages.filter(img => img.url && img.url.trim()),
      }
      const sanitizedMockups = formData.mockups.filter(img => img.url && img.url.trim())

      const sanitizedData = {
        ...formData,
        gallery: sanitizedGallery,
        mockups: sanitizedMockups,
      }

      if (mode === "create") {
        await createGDProject(sanitizedData)
        toast({ title: "Success", description: "Project created successfully" })
      } else {
        await updateGDProject(project!.slug, sanitizedData)
        toast({ title: "Success", description: "Project updated successfully" })
      }
      onSuccess()
    } catch (error) {
      console.error("Error saving project:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save project",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create New Project" : "Edit Project"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Add a new graphic design project" : `Editing: ${project?.title}`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Essential project details and metadata</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleChange("title", e.target.value)}
                      placeholder="My Awesome Project"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">
                      Slug <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="my-awesome-project"
                      required
                      className={slugError ? "border-red-500" : ""}
                    />
                    {slugError && <p className="text-xs text-red-500">{slugError}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">
                      Category <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleChange("category", e.target.value)}
                      placeholder="Branding, UI/UX, etc."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">
                      Year <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="year"
                      type="number"
                      min="2000"
                      max="2100"
                      value={formData.year}
                      onChange={(e) => handleChange("year", parseInt(e.target.value) || new Date().getFullYear())}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">
                      Role <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="role"
                      value={formData.role}
                      onChange={(e) => handleChange("role", e.target.value)}
                      placeholder="Lead Designer, etc."
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shortDescription">
                    Short Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="shortDescription"
                    value={formData.shortDescription}
                    onChange={(e) => handleChange("shortDescription", e.target.value)}
                    placeholder="A brief 1-2 line description"
                    rows={2}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="story">
                    Story <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="story"
                    value={formData.story}
                    onChange={(e) => handleChange("story", e.target.value)}
                    placeholder="Tell the full story (3-8 lines)"
                    rows={4}
                    required
                  />
                </div>

                <ChipsInput
                  label="Tags"
                  value={formData.tags}
                  onChange={(value) => handleChange("tags", value)}
                  placeholder="Add tags"
                />

                <ChipsInput
                  label="Tools"
                  value={formData.tools}
                  onChange={(value) => handleChange("tools", value)}
                  placeholder="Add tools"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cover Image</CardTitle>
                <CardDescription>Main thumbnail image for the project</CardDescription>
              </CardHeader>
              <CardContent>
                <ImageEditor
                  url={formData.coverImage.url}
                  alt={formData.coverImage.alt}
                  width={formData.coverImage.width}
                  height={formData.coverImage.height}
                  publicId={formData.coverImage.publicId}
                  onChange={(data) => handleChange("coverImage", data)}
                  required
                  label="Cover Image"
                  folder="gd-projects/covers"
                  defaultAlt={formData.title ? `${formData.title} - Cover` : "Cover Image"}
                />
              </CardContent>
            </Card>

            <GalleryBuilder
              gallery={formData.gallery}
              mockups={formData.mockups}
              onChange={(gallery, mockups) => {
                setFormData((prev) => ({ ...prev, gallery, mockups }))
              }}
            />

            <Card>
              <CardHeader>
                <CardTitle>Publishing Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: "draft" | "published") => handleChange("status", value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="featured">Featured Project</Label>
                  <Switch
                    id="featured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked: boolean) => handleChange("isFeatured", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || uploading || !!slugError}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : uploading ? "Uploading..." : "Save Project"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
