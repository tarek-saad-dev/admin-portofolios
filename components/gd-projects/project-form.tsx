"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { ChipsInput } from "./chips-input"
import { ImageEditor } from "./image-editor"
import { GalleryBuilder } from "./gallery-builder"
import { GDProject, GDProjectInput } from "@/types/gd-project"
import { createGDProject, updateGDProject } from "@/services/gd-project-service"

interface ProjectFormProps {
  project?: GDProject
  mode: "create" | "edit"
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

export function ProjectForm({ project, mode }: ProjectFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

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
    gallery: project?.gallery || { sliderImages: [], verticalImages: [] },
    mockups: project?.mockups || [],
    isFeatured: project?.isFeatured || false,
    status: project?.status || "draft",
  })

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(mode === "edit")
  const [slugError, setSlugError] = useState("")

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
    setHasUnsavedChanges(true)
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
      if (mode === "create") {
        await createGDProject(formData)
        toast({ title: "Success", description: "Project created successfully" })
      } else {
        await updateGDProject(project!.slug, formData)
        toast({ title: "Success", description: "Project updated successfully" })
      }
      setHasUnsavedChanges(false)
      router.push("/admin/gd-projects")
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

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/gd-projects">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {mode === "create" ? "Create New Project" : "Edit Project"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "create" ? "Add a new graphic design project" : `Editing: ${project?.title}`}
            </p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={saving || !!slugError}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Project"}
        </Button>
      </div>

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
                <p className="text-xs text-muted-foreground">
                  Auto-generated from title. Must be lowercase-kebab-case.
                </p>
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
                  placeholder="Lead Designer, Art Director, etc."
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
                placeholder="A brief 1-2 line description of the project"
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
                placeholder="Tell the full story of this project (3-8 lines)"
                rows={6}
                required
              />
            </div>

            <ChipsInput
              label="Tags"
              value={formData.tags}
              onChange={(value) => handleChange("tags", value)}
              placeholder="Add tags (e.g., branding, logo, identity)"
            />

            <ChipsInput
              label="Tools"
              value={formData.tools}
              onChange={(value) => handleChange("tools", value)}
              placeholder="Add tools (e.g., Photoshop, Illustrator)"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cover Image</CardTitle>
            <CardDescription>Main thumbnail image for the project card</CardDescription>
          </CardHeader>
          <CardContent>
            <ImageEditor
              url={formData.coverImage.url}
              alt={formData.coverImage.alt}
              width={formData.coverImage.width}
              height={formData.coverImage.height}
              onChange={(data) => handleChange("coverImage", data)}
              required
            />
          </CardContent>
        </Card>

        <GalleryBuilder
          gallery={formData.gallery}
          mockups={formData.mockups}
          onChange={(gallery, mockups) => {
            setFormData((prev) => ({ ...prev, gallery, mockups }))
            setHasUnsavedChanges(true)
          }}
        />

        <Card>
          <CardHeader>
            <CardTitle>Publishing Options</CardTitle>
            <CardDescription>Control visibility and featured status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="status">Status</Label>
                <p className="text-sm text-muted-foreground">
                  Draft projects are only visible in admin panel
                </p>
              </div>
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
              <div className="space-y-0.5">
                <Label htmlFor="featured">Featured Project</Label>
                <p className="text-sm text-muted-foreground">
                  Featured projects appear prominently on the homepage
                </p>
              </div>
              <Switch
                id="featured"
                checked={formData.isFeatured}
                onCheckedChange={(checked: boolean) => handleChange("isFeatured", checked)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 sticky bottom-4 bg-background p-4 border rounded-lg shadow-lg">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/gd-projects">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving || !!slugError}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Project"}
          </Button>
        </div>
      </form>
    </div>
  )
}
