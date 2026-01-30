"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Plus, Edit, Trash2, Search, Filter } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { VideoProjectForm } from "@/components/admin/video-project-form"
import { VideoProject } from "@/types/video-project"
import { normalizeVideoProjects } from "@/lib/video-project-normalizer"
import Image from "next/image"

export default function AdminDashboard() {
  const { toast } = useToast()
  const [projects, setProjects] = useState<VideoProject[]>([])
  const [filteredProjects, setFilteredProjects] = useState<VideoProject[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<VideoProject | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<VideoProject | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")

  const portfolioId = "video"

  // Fetch projects
  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/video-projects?portfolioId=${portfolioId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }
      
      const data = await response.json()
      const normalizedProjects = normalizeVideoProjects(data)
      setProjects(normalizedProjects)
      setFilteredProjects(normalizedProjects)
    } catch (error: any) {
      console.error('Error fetching projects:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load projects",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  // Filter projects
  useEffect(() => {
    let filtered = [...projects]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        project.category.toLowerCase().includes(query)
      )
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(project => project.category === categoryFilter)
    }

    // Year filter
    if (yearFilter !== "all") {
      filtered = filtered.filter(project => project.year === yearFilter)
    }

    setFilteredProjects(filtered)
  }, [projects, searchQuery, categoryFilter, yearFilter])

  // Get unique categories and years for filters
  const categories = Array.from(new Set(projects.map(p => p.category).filter(Boolean)))
  const years = Array.from(new Set(projects.map(p => p.year).filter(Boolean))).sort((a, b) => b.localeCompare(a))

  // Handle delete
  const handleDelete = async () => {
    if (!projectToDelete) return

    try {
      const response = await fetch(`/api/video-projects/${projectToDelete.id}?portfolioId=${portfolioId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete project')
      }

      toast({
        title: "Success",
        description: "Project deleted successfully",
      })

      setDeleteDialogOpen(false)
      setProjectToDelete(null)
      fetchProjects()
    } catch (error: any) {
      console.error('Error deleting project:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete project",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (project: VideoProject) => {
    setEditingProject(project)
    setFormOpen(true)
  }

  const handleAdd = () => {
    setEditingProject(null)
    setFormOpen(true)
  }

  const handleFormSuccess = () => {
    fetchProjects()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Video Portfolio Admin</h1>
            <p className="text-muted-foreground">Manage your video portfolio projects</p>
          </div>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
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
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                onClick={() => setViewMode("table")}
                className="flex-1"
              >
                Table
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                onClick={() => setViewMode("grid")}
                className="flex-1"
              >
                Grid
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
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
              {projects.length === 0 ? "No projects yet. Add your first project!" : "No projects match your filters."}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        <Card>
          <CardHeader>
            <CardTitle>Projects ({filteredProjects.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Thumbnail</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Tools</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id || String(project._id)}>
                    <TableCell>
                      {project.thumbnail ? (
                        <div className="relative w-20 h-12 rounded overflow-hidden bg-muted">
                          <Image
                            src={project.thumbnail}
                            alt={project.title || 'Project thumbnail'}
                            fill
                            className="object-cover"
                            unoptimized
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{project.title || 'Untitled'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{project.category || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>{project.year || 'N/A'}</TableCell>
                    <TableCell>{project.duration || '00:00'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {project.tools && project.tools.length > 0 ? (
                          project.tools.slice(0, 2).map((tool, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tool}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                        {project.tools && project.tools.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{project.tools.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(project)}
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
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id || String(project._id)}>
              <div className="relative w-full aspect-video">
                {project.thumbnail ? (
                  <Image
                    src={project.thumbnail}
                    alt={project.title || 'Project thumbnail'}
                    fill
                    className="object-cover rounded-t-lg"
                    unoptimized
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center rounded-t-lg">
                    <span className="text-muted-foreground">No Thumbnail</span>
                  </div>
                )}
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-2">{project.title || 'Untitled'}</CardTitle>
                <CardDescription className="line-clamp-2">{project.description || 'No description'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline">{project.category || 'N/A'}</Badge>
                  <Badge variant="secondary">{project.year || 'N/A'}</Badge>
                  <Badge variant="secondary">{project.duration || '00:00'}</Badge>
                </div>
                {project.tools && project.tools.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {project.tools.slice(0, 3).map((tool, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tool}
                      </Badge>
                    ))}
                    {project.tools.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{project.tools.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(project)}
                  >
                    <Edit className="h-3 w-3 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setProjectToDelete(project)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Form Dialog */}
      <VideoProjectForm
        open={formOpen}
        onOpenChange={setFormOpen}
        project={editingProject}
        onSuccess={handleFormSuccess}
        portfolioId={portfolioId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              <strong> "{projectToDelete?.title || 'this project'}"</strong>.
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
