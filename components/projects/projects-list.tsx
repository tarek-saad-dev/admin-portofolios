"use client"

import { useState, useEffect } from "react"
import { Project } from "@/components/portfolio-selector"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import { ProjectForm } from "./project-form"
import { useToast } from "@/components/ui/use-toast"
import { normalizeProjects } from "@/lib/project-normalizer"
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
import { getDbUriForPortfolio } from "@/lib/portfolio-config"
import { GDProjectsList } from "./gd-projects-list"

interface ProjectsListProps {
  projects: Project[];
  selectedPortfolio: string;
  onProjectAdded: (project: Project) => void;
  onProjectDeleted?: (projectId: number | string) => void;
}

export function ProjectsList({ projects, selectedPortfolio, onProjectAdded, onProjectDeleted }: ProjectsListProps) {
  // Normalize projects on mount and when projects prop changes
  const [projectsList, setProjectsList] = useState<Project[]>(() => normalizeProjects(projects));
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Update projects list when projects prop changes (normalized)
  useEffect(() => {
    setProjectsList(normalizeProjects(projects));
  }, [projects]);

  // Function to handle project updates
  const handleProjectUpdated = (updatedProject: Project) => {
    const normalized = normalizeProjects([updatedProject])[0];
    setProjectsList(prev =>
      prev.map(project => {
        // Safe comparison that handles both string and number ids
        const projectId = String(project.id ?? '');
        const normalizedId = String(normalized.id ?? '');
        return projectId === normalizedId ? normalized : project;
      })
    );

    // Also update the parent component's state
    onProjectAdded(normalized);

    toast({
      title: "Success",
      description: "Project updated successfully",
    });
  };

  // Function to handle project deletion
  const handleDelete = async () => {
    if (!projectToDelete) return;

    try {
      const dbUri = getDbUriForPortfolio(selectedPortfolio);
      if (!dbUri) {
        toast({
          title: "Error",
          description: "Database URI not found for portfolio",
          variant: "destructive"
        });
        return;
      }

      const projectId = projectToDelete.id;
      const response = await fetch(`/api/projects/${projectId}?portfolioId=${selectedPortfolio}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete project');
      }

      // Remove from local state
      setProjectsList(prev => prev.filter(p => {
        const pid = String(p.id ?? '');
        const deleteId = String(projectId ?? '');
        return pid !== deleteId;
      }));

      // Notify parent component
      if (onProjectDeleted) {
        onProjectDeleted(projectId);
      }

      toast({
        title: "Success",
        description: "Project deleted successfully",
      });

      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete project",
        variant: "destructive"
      });
    }
  };

  // If Graphic Design Portfolio is selected, render the Behance-style GD Projects list
  if (selectedPortfolio === "graphics") {
    return <GDProjectsList />
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Projects</h2>
        <ProjectForm
          selectedPortfolio={selectedPortfolio}
          projects={projectsList}
          onProjectAdded={(newProject) => {
            setProjectsList(prev => [...prev, newProject]);
            onProjectAdded(newProject);
          }}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projectsList.length > 0 ? (
          projectsList.map((project, index) => (
            <ProjectCard
              key={project.id != null ? String(project.id) : `project-${index}`}
              project={project}
              selectedPortfolio={selectedPortfolio}
              onProjectUpdated={handleProjectUpdated}
              onDeleteClick={() => {
                setProjectToDelete(project);
                setDeleteDialogOpen(true);
              }}
            />
          ))
        ) : (
          <p>No projects found.</p>
        )}
      </div>

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

// Updated Card component to display individual project information
function ProjectCard({
  project,
  selectedPortfolio,
  onProjectUpdated,
  onDeleteClick
}: {
  project: Project;
  selectedPortfolio: string;
  onProjectUpdated: (project: Project) => void;
  onDeleteClick: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.title || 'Untitled Project'}</CardTitle>
        <CardDescription>{project.description || 'No description available'}</CardDescription>
      </CardHeader>
      <CardContent>
        {project.skills && project.skills.length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-medium">Skills:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {project.skills.map((skill, index) => (
                <span key={index} className="text-xs bg-secondary px-2 py-1 rounded">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <ProjectForm
          selectedPortfolio={selectedPortfolio}
          projects={[project]}
          onProjectAdded={() => { }}
          onProjectUpdated={onProjectUpdated}
          projectToEdit={project}
          isEditMode={true}
          trigger={
            <Button variant="outline" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
          }
        />
        <Button
          variant="outline"
          size="icon"
          onClick={onDeleteClick}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}