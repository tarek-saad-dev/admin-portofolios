"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { VideoProject, VideoProjectInput } from "@/types/video-project"
import { isValidYouTubeUrl, getThumbnailFromUrl } from "@/lib/youtube-utils"
import { normalizeVideoProject } from "@/lib/video-project-normalizer"
import Image from "next/image"

interface VideoProjectFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: VideoProject | null
  onSuccess: () => void
  portfolioId?: string
}

export function VideoProjectForm({ 
  open, 
  onOpenChange, 
  project, 
  onSuccess,
  portfolioId = 'video'
}: VideoProjectFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<VideoProjectInput>({
    title: '',
    category: '',
    year: new Date().getFullYear().toString(),
    duration: '00:00',
    tools: [],
    description: '',
    youtubeUrl: '',
    thumbnail: null
  })
  const [toolsInput, setToolsInput] = useState('')
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [youtubeError, setYoutubeError] = useState<string>('')

  const isEditMode = !!project

  // Initialize form when project changes or dialog opens
  useEffect(() => {
    if (open) {
      if (project) {
        setFormData({
          title: project.title || '',
          category: project.category || '',
          year: project.year || new Date().getFullYear().toString(),
          duration: project.duration || '00:00',
          tools: project.tools || [],
          description: project.description || '',
          youtubeUrl: project.youtubeUrl || '',
          thumbnail: project.thumbnail || null
        })
        setToolsInput(project.tools?.join(', ') || '')
        setThumbnailPreview(project.thumbnail || null)
      } else {
        // Reset form for new project
        setFormData({
          title: '',
          category: '',
          year: new Date().getFullYear().toString(),
          duration: '00:00',
          tools: [],
          description: '',
          youtubeUrl: '',
          thumbnail: null
        })
        setToolsInput('')
        setThumbnailPreview(null)
      }
      setYoutubeError('')
    }
  }, [project, open])

  // Handle YouTube URL change and auto-generate thumbnail
  const handleYouTubeUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, youtubeUrl: url }))
    
    if (!url.trim()) {
      setThumbnailPreview(null)
      setFormData(prev => ({ ...prev, thumbnail: null }))
      setYoutubeError('')
      return
    }

    if (isValidYouTubeUrl(url)) {
      setYoutubeError('')
      const thumbnail = getThumbnailFromUrl(url)
      if (thumbnail) {
        setThumbnailPreview(thumbnail)
        setFormData(prev => ({ ...prev, thumbnail }))
      }
    } else {
      setYoutubeError('Please enter a valid YouTube URL')
      setThumbnailPreview(null)
      setFormData(prev => ({ ...prev, thumbnail: null }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate YouTube URL
      if (!formData.youtubeUrl.trim()) {
        toast({
          title: "Validation Error",
          description: "YouTube URL is required",
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }

      if (!isValidYouTubeUrl(formData.youtubeUrl)) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid YouTube URL",
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }

      // Parse tools from comma-separated input
      const tools = toolsInput
        .split(',')
        .map(tool => tool.trim())
        .filter(tool => tool.length > 0)

      // Prepare project data
      const projectData = {
        ...formData,
        tools,
        thumbnail: formData.thumbnail || getThumbnailFromUrl(formData.youtubeUrl)
      }

      // Normalize before sending
      const normalizedData = normalizeVideoProject(projectData)

      let response
      if (isEditMode && project) {
        // Update existing project
        response = await fetch(`/api/video-projects/${project.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            project: normalizedData,
            portfolioId
          }),
        })
      } else {
        // Create new project
        response = await fetch('/api/video-projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            project: normalizedData,
            portfolioId
          }),
        })
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save project')
      }

      toast({
        title: "Success",
        description: isEditMode ? "Video project updated successfully" : "Video project created successfully",
      })

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error saving video project:', error)
      toast({
        title: "Error",
        description: error.message || 'Failed to save video project',
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Video Project' : 'Add New Video Project'}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update the details for this video project.'
              : 'Fill in the details for your new video project. The thumbnail will be auto-generated from the YouTube URL.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
                placeholder="Enter project title"
              />
            </div>

            {/* Category and Year */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  required
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Short Film">Short Film</SelectItem>
                    <SelectItem value="Music Video">Music Video</SelectItem>
                    <SelectItem value="Commercial">Commercial</SelectItem>
                    <SelectItem value="Documentary">Documentary</SelectItem>
                    <SelectItem value="Trailer">Trailer</SelectItem>
                    <SelectItem value="Event Video">Event Video</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  type="text"
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                  required
                  placeholder="2024"
                />
              </div>
            </div>

            {/* Duration */}
            <div className="grid gap-2">
              <Label htmlFor="duration">Duration *</Label>
              <Input
                id="duration"
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                required
                placeholder="12:34"
                pattern="[0-9]{1,2}:[0-9]{2}"
              />
              <p className="text-xs text-muted-foreground">Format: MM:SS or HH:MM:SS</p>
            </div>

            {/* YouTube URL */}
            <div className="grid gap-2">
              <Label htmlFor="youtubeUrl">YouTube URL *</Label>
              <Input
                id="youtubeUrl"
                type="url"
                value={formData.youtubeUrl}
                onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                required
                placeholder="https://www.youtube.com/watch?v=..."
              />
              {youtubeError && (
                <p className="text-xs text-red-500">{youtubeError}</p>
              )}
            </div>

            {/* Thumbnail Preview */}
            {thumbnailPreview && (
              <div className="grid gap-2">
                <Label>Thumbnail Preview</Label>
                <div className="relative w-full aspect-video border rounded-md overflow-hidden bg-muted">
                  <Image
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    fill
                    className="object-cover"
                    unoptimized
                    onError={() => {
                      setThumbnailPreview(null)
                      setFormData(prev => ({ ...prev, thumbnail: null }))
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Thumbnail will be auto-generated from YouTube</p>
              </div>
            )}

            {/* Tools */}
            <div className="grid gap-2">
              <Label htmlFor="tools">Tools</Label>
              <Input
                id="tools"
                value={toolsInput}
                onChange={(e) => setToolsInput(e.target.value)}
                placeholder="DaVinci Resolve, After Effects, Pro Tools"
              />
              <p className="text-xs text-muted-foreground">Separate multiple tools with commas</p>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
                placeholder="Enter project description"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Project' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

