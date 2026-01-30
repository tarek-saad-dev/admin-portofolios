"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, X } from "lucide-react"
import { Project } from "@/components/portfolio-selector"
import { useToast } from "@/components/ui/use-toast"
import { getDbUriForPortfolio } from "@/lib/portfolio-config"
import { normalizeProject } from "@/lib/project-normalizer"
import { isValidYouTubeUrl, getThumbnailFromUrl } from "@/lib/youtube-utils"

// Updating the ProjectForm props to handle editing
interface ProjectFormProps {
  selectedPortfolio: string;
  projects: Project[];
  onProjectAdded: (project: Project) => void;
  onProjectUpdated?: (project: Project) => void;
  projectToEdit?: Project | null;
  isEditMode?: boolean;
  trigger?: React.ReactNode;
}

export function ProjectForm({ 
  selectedPortfolio, 
  projects, 
  onProjectAdded, 
  onProjectUpdated,
  projectToEdit = null,
  isEditMode = false,
  trigger
}: ProjectFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(false)
  const [newProject, setNewProject] = useState<Partial<Project>>({
    title: "",
    description: "",
    imgPath: "/Assets/Projects/default.png",
    imagePaths: [],
    ghLink: "",
    demoLink: "",
    youtubeUrl: "",
    skills: [],
    technologies: [],
    tools: [],
    keyFeatures: [],
    date: new Date().toISOString().split('T')[0],
    views: 0
  })
  const [youtubeError, setYoutubeError] = useState<string>("")
  
  // Update form when projectToEdit changes
  useEffect(() => {
    if (projectToEdit && open) {
      setNewProject({
        ...projectToEdit,
        // Ensure date is in the correct format
        date: projectToEdit.date || new Date().toISOString().split('T')[0],
        youtubeUrl: projectToEdit.youtubeUrl || ""
      });
    } else if (!open && !isEditMode) {
      // Reset form when dialog closes (but not in edit mode)
      setNewProject({
        title: "",
        description: "",
        imgPath: "/Assets/Projects/default.png",
        imagePaths: [],
        ghLink: "",
        demoLink: "",
        youtubeUrl: "",
        skills: [],
        technologies: [],
        tools: [],
        keyFeatures: [],
        date: new Date().toISOString().split('T')[0],
        views: 0
      });
      setYoutubeError("");
    }
  }, [projectToEdit, open, isEditMode]);

  const { toast } = useToast()
  
  // State for array input fields
  const [newImagePath, setNewImagePath] = useState("")
  const [newSkill, setNewSkill] = useState("")
  const [newTechnology, setNewTechnology] = useState("")
  const [newTool, setNewTool] = useState("")
  const [newKeyFeature, setNewKeyFeature] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewProject(prev => ({ ...prev, [name]: value }));
    
    // Handle YouTube URL validation and thumbnail generation
    if (name === 'youtubeUrl') {
      if (!value.trim()) {
        setYoutubeError("");
        return;
      }
      
      if (isValidYouTubeUrl(value)) {
        setYoutubeError("");
        // Auto-generate thumbnail if YouTube URL is valid
        const thumbnail = getThumbnailFromUrl(value);
        if (thumbnail && selectedPortfolio === 'video') {
          setNewProject(prev => ({ ...prev, thumbnail }));
        }
      } else {
        setYoutubeError("Please enter a valid YouTube URL");
      }
    }
  }

  // Handlers for array fields
  const handleAddImagePath = () => {
    if (newImagePath.trim()) {
      setNewProject(prev => ({
        ...prev,
        imagePaths: [...(prev.imagePaths || []), newImagePath.trim()]
      }));
      setNewImagePath("");
    }
  }

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setNewProject(prev => ({
        ...prev,
        skills: [...(prev.skills || []), newSkill.trim()]
      }));
      setNewSkill("");
    }
  }

  const handleAddTechnology = () => {
    if (newTechnology.trim()) {
      setNewProject(prev => ({
        ...prev,
        technologies: [...(prev.technologies || []), newTechnology.trim()]
      }));
      setNewTechnology("");
    }
  }

  const handleAddTool = () => {
    if (newTool.trim()) {
      setNewProject(prev => ({
        ...prev,
        tools: [...(prev.tools || []), newTool.trim()]
      }));
      setNewTool("");
    }
  }

  const handleAddKeyFeature = () => {
    if (newKeyFeature.trim()) {
      setNewProject(prev => ({
        ...prev,
        keyFeatures: [...(prev.keyFeatures || []), `🔹 ${newKeyFeature.trim()}`]
      }));
      setNewKeyFeature("");
    }
  }

  // Handlers to remove items from arrays
  const handleRemoveItem = (array: string, index: number) => {
    setNewProject(prev => {
      const updatedArray = [...(prev[array as keyof typeof prev] as string[] || [])];
      updatedArray.splice(index, 1);
      return { ...prev, [array]: updatedArray };
    });
  }

  // Update the handleAddProject function to handle both adding and updating
  const handleSubmitProject = async (e: React.FormEvent, closeDialog: () => void) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Get the database URI for the selected portfolio from environment variables
      const dbUri = getDbUriForPortfolio(selectedPortfolio);
      
      if (!dbUri) {
        toast({
          title: "Error",
          description: "No database URI found for the selected portfolio",
          variant: "destructive"
        });
        return;
      }
      
      let projectToSubmit: Project;
      let response;
      
      if (isEditMode && projectToEdit) {
        // Update existing project
        projectToSubmit = {
          ...projectToEdit,
          ...newProject as any
        };
        
        response = await fetch('/api/projects/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            project: projectToSubmit,
            dbUri 
          }),
        });
      } else {
        // Generate a new ID for new project
        const newId = projects.length > 0 
          ? Math.max(...projects.map(p => {
              const id = p.id;
              return typeof id === 'number' ? id : (typeof id === 'string' && /^\d+$/.test(id) ? parseInt(id, 10) : 0);
            }).filter(id => id > 0)) + 1 
          : 1;
        
        // Create the complete project object
        projectToSubmit = {
          ...newProject as any,
          id: newId,
        };
        
        // Submit to API
        response = await fetch('/api/projects/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            project: projectToSubmit,
            dbUri 
          }),
        });
      }
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Normalize the project from API response
      const normalizedProject = normalizeProject(result.project || result);
      
      // Call the appropriate callback
      if (isEditMode && onProjectUpdated) {
        onProjectUpdated(normalizedProject);
      } else {
        onProjectAdded(normalizedProject);
      }
      
      // Reset form if not in edit mode
      if (!isEditMode) {
        setNewProject({
          title: "",
          description: "",
          imgPath: "/Assets/Projects/default.png",
          imagePaths: [],
          ghLink: "",
          demoLink: "",
          youtubeUrl: "",
          skills: [],
          technologies: [],
          tools: [],
          keyFeatures: [],
          date: new Date().toISOString().split('T')[0],
          views: 0
        });
        setYoutubeError("");
      }
      
      // Show success message
      toast({
        title: "Success",
        description: isEditMode ? "Project updated successfully" : "Project added successfully",
      });
      
      // Close the dialog
      closeDialog();
      setOpen(false);
      
    } catch (error: any) {
      console.error(isEditMode ? "Error updating project:" : "Error adding project:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? 'update' : 'add'} project: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[725px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Project" : "Add New Project"}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? "Update the details for this project. Click save when you're done."
              : "Fill in the details for your new project. Click save when you're done."
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => {
          e.preventDefault();
          handleSubmitProject(e, () => {
            const closeButton = document.querySelector('[data-dialog-close]');
            if (closeButton instanceof HTMLElement) {
              closeButton.click();
            }
          });
        }}>
          <div className="grid gap-4 py-4">
            {/* Basic Information */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                name="title"
                value={newProject.title}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={newProject.description}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="imgPath" className="text-right">
                Main Image Path
              </Label>
              <Input
                id="imgPath"
                name="imgPath"
                value={newProject.imgPath}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            
            {/* Image Paths */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right mt-2">
                Additional Images
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newImagePath}
                    onChange={(e) => setNewImagePath(e.target.value)}
                    placeholder="Add image path"
                  />
                  <Button type="button" onClick={handleAddImagePath} size="sm">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newProject.imagePaths?.map((path, index) => (
                    <div key={index} className="flex items-center bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm">
                      {path.split('/').pop()}
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-4 w-4 p-0 ml-2"
                        onClick={() => handleRemoveItem('imagePaths', index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Links */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ghLink" className="text-right">
                GitHub Link
              </Label>
              <Input
                id="ghLink"
                name="ghLink"
                value={newProject.ghLink}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="demoLink" className="text-right">
                Demo Link
              </Label>
              <Input
                id="demoLink"
                name="demoLink"
                value={newProject.demoLink || ""}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="youtubeUrl" className="text-right">
                YouTube URL
              </Label>
              <div className="col-span-3">
                <Input
                  id="youtubeUrl"
                  name="youtubeUrl"
                  type="url"
                  value={newProject.youtubeUrl || ""}
                  onChange={handleInputChange}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={youtubeError ? "border-red-500" : ""}
                />
                {youtubeError && (
                  <p className="text-xs text-red-500 mt-1">{youtubeError}</p>
                )}
                {selectedPortfolio === 'video' && newProject.youtubeUrl && !youtubeError && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Thumbnail will be auto-generated from YouTube
                  </p>
                )}
              </div>
            </div>
            
            {/* Skills */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right mt-2">
                Skills
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add skill"
                  />
                  <Button type="button" onClick={handleAddSkill} size="sm">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newProject.skills?.map((skill, index) => (
                    <div key={index} className="flex items-center bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm">
                      {skill}
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-4 w-4 p-0 ml-2"
                        onClick={() => handleRemoveItem('skills', index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Technologies */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right mt-2">
                Technologies
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newTechnology}
                    onChange={(e) => setNewTechnology(e.target.value)}
                    placeholder="Add technology"
                  />
                  <Button type="button" onClick={handleAddTechnology} size="sm">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newProject.technologies?.map((tech, index) => (
                    <div key={index} className="flex items-center bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm">
                      {tech}
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-4 w-4 p-0 ml-2"
                        onClick={() => handleRemoveItem('technologies', index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Tools */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right mt-2">
                Tools
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newTool}
                    onChange={(e) => setNewTool(e.target.value)}
                    placeholder="Add tool"
                  />
                  <Button type="button" onClick={handleAddTool} size="sm">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newProject.tools?.map((tool, index) => (
                    <div key={index} className="flex items-center bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm">
                      {tool}
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-4 w-4 p-0 ml-2"
                        onClick={() => handleRemoveItem('tools', index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Key Features */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right mt-2">
                Key Features
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newKeyFeature}
                    onChange={(e) => setNewKeyFeature(e.target.value)}
                    placeholder="Add key feature"
                  />
                  <Button type="button" onClick={handleAddKeyFeature} size="sm">Add</Button>
                </div>
                <div className="space-y-2">
                  {newProject.keyFeatures?.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2 bg-secondary text-secondary-foreground p-2 rounded-md text-sm">
                      <div className="flex-1">{feature}</div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-5 w-5 p-0"
                        onClick={() => handleRemoveItem('keyFeatures', index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Date */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={newProject.date}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}