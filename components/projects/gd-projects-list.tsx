"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Star, Edit, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { GDProject, isGDProjectListResponse } from "@/types/gd-project"
import {
  listGDProjects,
  deleteGDProject,
  toggleGDProjectStatus,
  toggleGDProjectFeatured,
} from "@/services/gd-project-service"
import { GDProjectFormDialog } from "./gd-project-form-dialog"

export function GDProjectsList() {
  const { toast } = useToast()
  const [projects, setProjects] = useState<GDProject[]>([])
  const [filteredProjects, setFilteredProjects] = useState<GDProject[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<GDProject | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [formOpen, setFormOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<GDProject | null>(null)

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      const response = await listGDProjects({ includeDraft: true })

      // Handle both array response and object with data property
      let projectsData: GDProject[] = []
      if (Array.isArray(response)) {
        projectsData = response
      } else if (isGDProjectListResponse(response)) {
        projectsData = response.data
      }

      console.log('Fetched projects:', projectsData.length)
      setProjects(projectsData)
      setFilteredProjects(projectsData)
    } catch (error) {
      console.error("Error fetching projects:", error)
      setProjects([])
      setFilteredProjects([])
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load projects",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    // Defensive check: ensure projects is an array
    if (!Array.isArray(projects)) {
      console.warn('Projects is not an array:', projects)
      setFilteredProjects([])
      return
    }

    let filtered = [...projects]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (project) =>
          project.title?.toLowerCase().includes(query) ||
          (Array.isArray(project.tags) && project.tags.some((tag) => tag.toLowerCase().includes(query))) ||
          project.category?.toLowerCase().includes(query)
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((project) => project.category === categoryFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((project) => project.status === statusFilter)
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.updatedAt || b.createdAt || "").getTime() - new Date(a.updatedAt || a.createdAt || "").getTime()
        case "oldest":
          return new Date(a.updatedAt || a.createdAt || "").getTime() - new Date(b.updatedAt || b.createdAt || "").getTime()
        case "az":
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

    setFilteredProjects(filtered)
  }, [projects, searchQuery, categoryFilter, statusFilter, sortBy])

  const categories = Array.isArray(projects)
    ? Array.from(new Set(projects.map((p) => p.category).filter(Boolean)))
    : []

  const handleDelete = async () => {
    if (!projectToDelete) return

    try {
      await deleteGDProject(projectToDelete.slug)
      toast({
        title: "Success",
        description: "Project deleted successfully",
      })
      setDeleteDialogOpen(false)
      setProjectToDelete(null)
      fetchProjects()
    } catch (error) {
      console.error("Error deleting project:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete project",
        variant: "destructive",
      })
    }
  }

  const handleToggleStatus = async (project: GDProject) => {
    try {
      await toggleGDProjectStatus(project.slug, project.status)
      toast({
        title: "Success",
        description: `Project ${project.status === "draft" ? "published" : "unpublished"} successfully`,
      })
      fetchProjects()
    } catch (error) {
      console.error("Error toggling status:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      })
    }
  }

  const handleToggleFeatured = async (project: GDProject) => {
    try {
      await toggleGDProjectFeatured(project.slug, project.isFeatured)
      toast({
        title: "Success",
        description: `Project ${project.isFeatured ? "unfeatured" : "featured"} successfully`,
      })
      fetchProjects()
    } catch (error) {
      console.error("Error toggling featured:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update featured status",
        variant: "destructive",
      })
    }
  }

  const handleAddProject = () => {
    setEditingProject(null)
    setFormOpen(true)
  }

  const handleEditProject = (project: GDProject) => {
    setEditingProject(project)
    setFormOpen(true)
  }

  const handleFormSuccess = () => {
    setFormOpen(false)
    setEditingProject(null)
    fetchProjects()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Graphic Design Projects</h2>
        <Button onClick={handleAddProject}>
          Add Project
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="az">A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </CardContent>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {projects.length === 0 ? "No projects yet. Create your first project!" : "No projects match your filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Projects ({filteredProjects.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Cover</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(filteredProjects) && filteredProjects.map((project) => (
                  <TableRow key={project.slug}>
                    <TableCell>
                      {project.coverImage?.url ? (
                        <div className="relative w-20 h-12 rounded overflow-hidden bg-muted">
                          <Image
                            src={project.coverImage.url}
                            alt={project.coverImage.alt || project.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{project.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{project.category}</Badge>
                    </TableCell>
                    <TableCell>{project.year}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(project)}
                        className="h-7"
                      >
                        <Badge variant={project.status === "published" ? "default" : "secondary"}>
                          {project.status}
                        </Badge>
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleFeatured(project)}
                        className="h-8 w-8"
                      >
                        <Star
                          className={`h-4 w-4 ${project.isFeatured ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                            }`}
                        />
                      </Button>
                    </TableCell>
                    <TableCell>
                      {project.updatedAt
                        ? new Date(project.updatedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditProject(project)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setProjectToDelete(project)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <GDProjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        project={editingProject}
        onSuccess={handleFormSuccess}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              <strong> &quot;{projectToDelete?.title || "this project"}&quot;</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProjectToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
