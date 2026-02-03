"use client"

import { useState } from "react"
import { Plus, Trash2, AlertCircle, Edit, GripVertical, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Experience } from "@/types/experience"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { addExperience, deleteExperience, editExperience } from "@/services/experience-service"

// Available organization logos
const ORGANIZATION_LOGOS = [
  { label: "No Logo", value: "__none__" },
  { label: "Brain GYM", value: "brain-gym.png" },
  { label: "Tech Corp", value: "tech-corp.svg" },
  { label: "Digital Agency", value: "digital-agency.png" },
  { label: "Startup Inc", value: "startup-inc.svg" },
  { label: "Enterprise Co", value: "enterprise-co.png" },
]

interface ExperiencesListProps {
  experiences: Experience[]
  isLoading: boolean
  selectedPortfolio: string
  getDbUriForPortfolio: (portfolioId: string) => string
  onExperienceAdded: (experience: Experience) => void
  onExperienceEdited: (experience: Experience) => void
  onExperienceDeleted: (experienceId: string) => void
}

export function ExperiencesList({
  experiences,
  isLoading,
  selectedPortfolio,
  getDbUriForPortfolio,
  onExperienceAdded,
  onExperienceEdited,
  onExperienceDeleted
}: ExperiencesListProps) {
  const [isAddExperienceDialogOpen, setIsAddExperienceDialogOpen] = useState(false)
  const [isEditExperienceDialogOpen, setIsEditExperienceDialogOpen] = useState(false)
  const [newExperience, setNewExperience] = useState<Omit<Experience, '_id'>>({
    title: "",
    company: "",
    duration: "",
    type: "",
    role: [""],
    order: 0,
    organizationLogoKey: ""
  })
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null)
  const [editExperienceData, setEditExperienceData] = useState<Omit<Experience, '_id'>>({
    title: "",
    company: "",
    duration: "",
    type: "",
    role: [""],
    order: 0,
    organizationLogoKey: ""
  })
  const [isAddingExperience, setIsAddingExperience] = useState(false)
  const [isEditingExperience, setIsEditingExperience] = useState(false)
  const [addExperienceError, setAddExperienceError] = useState<string | null>(null)
  const [editExperienceError, setEditExperienceError] = useState<string | null>(null)
  const [experienceToDelete, setExperienceToDelete] = useState<Experience | null>(null)
  const [isDeletingExperience, setIsDeletingExperience] = useState(false)
  const [deleteExperienceError, setDeleteExperienceError] = useState<string | null>(null)

  // Function to handle adding a new role field
  const handleAddRole = (isEdit: boolean = false) => {
    if (isEdit) {
      setEditExperienceData({
        ...editExperienceData,
        role: [...editExperienceData.role, ""]
      });
    } else {
      setNewExperience({
        ...newExperience,
        role: [...newExperience.role, ""]
      });
    }
  };

  // Function to handle removing a role field
  const handleRemoveRole = (index: number, isEdit: boolean = false) => {
    if (isEdit) {
      const updatedRoles = [...editExperienceData.role];
      updatedRoles.splice(index, 1);
      setEditExperienceData({
        ...editExperienceData,
        role: updatedRoles
      });
    } else {
      const updatedRoles = [...newExperience.role];
      updatedRoles.splice(index, 1);
      setNewExperience({
        ...newExperience,
        role: updatedRoles
      });
    }
  };

  // Function to handle role input change
  const handleRoleChange = (index: number, value: string, isEdit: boolean = false) => {
    if (isEdit) {
      const updatedRoles = [...editExperienceData.role];
      updatedRoles[index] = value;
      setEditExperienceData({
        ...editExperienceData,
        role: updatedRoles
      });
    } else {
      const updatedRoles = [...newExperience.role];
      updatedRoles[index] = value;
      setNewExperience({
        ...newExperience,
        role: updatedRoles
      });
    }
  };

  // Function to handle adding a new experience
  const handleAddExperience = async () => {
    // Validate required fields
    if (!newExperience.title.trim() || !newExperience.company.trim() ||
      !newExperience.duration.trim() || !newExperience.type.trim() ||
      newExperience.role.some(r => !r.trim())) {
      setAddExperienceError("All fields are required");
      return;
    }

    setIsAddingExperience(true);
    setAddExperienceError(null);

    try {
      const dbUri = getDbUriForPortfolio(selectedPortfolio);
      if (!dbUri) {
        throw new Error("No database URI found for the selected portfolio");
      }

      // Filter out empty role entries
      const filteredExperience = {
        ...newExperience,
        role: newExperience.role.filter(r => r.trim() !== "")
      };

      const addedExperience = await addExperience(dbUri, selectedPortfolio, filteredExperience);
      console.log("Experience added:", addedExperience);

      // Notify parent component
      onExperienceAdded(addedExperience);

      // Reset the form and close the dialog
      setNewExperience({
        title: "",
        company: "",
        duration: "",
        type: "",
        role: [""],
        order: experiences.length > 0 ? Math.max(...experiences.map(e => e.order)) + 1 : 0,
        organizationLogoKey: ""
      });
      setIsAddExperienceDialogOpen(false);
    } catch (error: any) {
      console.error("Error adding experience:", error);
      setAddExperienceError(error.message);
    } finally {
      setIsAddingExperience(false);
    }
  };

  // Function to open edit dialog and set initial values
  const handleOpenEditDialog = (experience: Experience) => {
    setEditingExperience(experience);
    setEditExperienceData({
      title: experience.title,
      company: experience.company,
      duration: experience.duration,
      type: experience.type,
      role: [...experience.role],
      order: experience.order,
      organizationLogoKey: experience.organizationLogoKey || ""
    });
    setIsEditExperienceDialogOpen(true);
  };

  // Function to handle editing an experience
  const handleEditExperience = async () => {
    if (!editingExperience) return;

    // Validate required fields
    if (!editExperienceData.title.trim() || !editExperienceData.company.trim() ||
      !editExperienceData.duration.trim() || !editExperienceData.type.trim() ||
      editExperienceData.role.some(r => !r.trim())) {
      setEditExperienceError("All fields are required");
      return;
    }

    setIsEditingExperience(true);
    setEditExperienceError(null);

    try {
      const dbUri = getDbUriForPortfolio(selectedPortfolio);
      if (!dbUri) {
        throw new Error("No database URI found for the selected portfolio");
      }

      // Filter out empty role entries
      const filteredExperience = {
        ...editExperienceData,
        role: editExperienceData.role.filter(r => r.trim() !== "")
      };

      const updatedExperience = await editExperience(
        dbUri,
        selectedPortfolio,
        editingExperience._id,
        filteredExperience
      );
      console.log("Experience updated:", updatedExperience);

      // Notify parent component
      onExperienceEdited(updatedExperience);

      // Reset the form and close the dialog
      setEditingExperience(null);
      setEditExperienceData({
        title: "",
        company: "",
        duration: "",
        type: "",
        role: [""],
        order: 0,
        organizationLogoKey: ""
      });
      setIsEditExperienceDialogOpen(false);
    } catch (error: any) {
      console.error("Error editing experience:", error);
      setEditExperienceError(error.message);
    } finally {
      setIsEditingExperience(false);
    }
  };

  // Function to handle deleting an experience
  const handleDeleteExperience = async () => {
    if (!experienceToDelete) return;

    setIsDeletingExperience(true);
    setDeleteExperienceError(null);

    try {
      const dbUri = getDbUriForPortfolio(selectedPortfolio);
      if (!dbUri) {
        throw new Error("No database URI found for the selected portfolio");
      }

      const result = await deleteExperience(dbUri, selectedPortfolio, experienceToDelete._id);
      console.log("Experience deleted:", result);

      // Notify parent component
      onExperienceDeleted(experienceToDelete._id);

      // Reset the state
      setExperienceToDelete(null);
    } catch (error: any) {
      console.error("Error deleting experience:", error);
      setDeleteExperienceError(error.message);
    } finally {
      setIsDeletingExperience(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Experience</h2>
        <Button onClick={() => {
          setNewExperience({
            title: "",
            company: "",
            duration: "",
            type: "",
            role: [""],
            order: experiences.length > 0 ? Math.max(...experiences.map(e => e.order)) + 1 : 0,
            organizationLogoKey: ""
          });
          setIsAddExperienceDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Experience
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : experiences.length > 0 ? (
        <div className="space-y-4">
          {experiences.map((experience) => (
            <div key={experience._id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleOpenEditDialog(experience)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setExperienceToDelete(experience)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-start">
                <div className="mr-4 mt-1">
                  <GripVertical className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{experience.title}</h3>
                      <p className="text-sm font-medium">{experience.company}</p>
                      <div className="flex text-sm text-muted-foreground mt-1">
                        <span>{experience.duration}</span>
                        <span className="mx-2">•</span>
                        <span>{experience.type}</span>
                      </div>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1 list-disc list-inside text-sm">
                    {experience.role.map((role, index) => (
                      <li key={index}>{role}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No experience entries found for this portfolio. Add your first experience to get started.
        </div>
      )}

      {/* Add Experience Dialog */}
      <Dialog open={isAddExperienceDialogOpen} onOpenChange={setIsAddExperienceDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Experience</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="experience-title" className="text-right">
                Title
              </Label>
              <Input
                id="experience-title"
                value={newExperience.title}
                onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
                className="col-span-3"
                placeholder="Senior Developer"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="experience-company" className="text-right">
                Company
              </Label>
              <Input
                id="experience-company"
                value={newExperience.company}
                onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                className="col-span-3"
                placeholder="Acme Inc."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="experience-duration" className="text-right">
                Duration
              </Label>
              <Input
                id="experience-duration"
                value={newExperience.duration}
                onChange={(e) => setNewExperience({ ...newExperience, duration: e.target.value })}
                className="col-span-3"
                placeholder="Jan 2022 - Present"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="experience-type" className="text-right">
                Type
              </Label>
              <Input
                id="experience-type"
                value={newExperience.type}
                onChange={(e) => setNewExperience({ ...newExperience, type: e.target.value })}
                className="col-span-3"
                placeholder="Full-time"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="experience-logo" className="text-right">
                Logo
              </Label>
              <div className="col-span-3 space-y-2">
                <Select
                  value={newExperience.organizationLogoKey || undefined}
                  onValueChange={(value) => setNewExperience({ ...newExperience, organizationLogoKey: value === "__none__" ? "" : value })}
                >
                  <SelectTrigger id="experience-logo">
                    <SelectValue placeholder="Select organization logo" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORGANIZATION_LOGOS.map((logo) => (
                      <SelectItem key={logo.value} value={logo.value}>
                        {logo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {newExperience.organizationLogoKey && (
                  <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Selected: {ORGANIZATION_LOGOS.find(l => l.value === newExperience.organizationLogoKey || (newExperience.organizationLogoKey === "" && l.value === "__none__"))?.label}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right mt-2">
                Roles
              </Label>
              <div className="col-span-3 space-y-2">
                {newExperience.role.map((role, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Textarea
                      value={role}
                      onChange={(e) => handleRoleChange(index, e.target.value)}
                      placeholder="Describe your responsibilities"
                      className="flex-1"
                    />
                    {newExperience.role.length > 1 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveRole(index)}
                        className="flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => handleAddRole()}
                  className="w-full mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Role
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="experience-order" className="text-right">
                Order
              </Label>
              <Input
                id="experience-order"
                type="number"
                value={newExperience.order}
                onChange={(e) => setNewExperience({ ...newExperience, order: parseInt(e.target.value) || 0 })}
                className="col-span-3"
              />
            </div>
            {addExperienceError && (
              <div className="text-red-500 text-sm mt-2">{addExperienceError}</div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddExperience} disabled={isAddingExperience}>
              {isAddingExperience ? "Adding..." : "Add Experience"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Experience Dialog */}
      <Dialog open={isEditExperienceDialogOpen} onOpenChange={setIsEditExperienceDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Experience</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-experience-title" className="text-right">
                Title
              </Label>
              <Input
                id="edit-experience-title"
                value={editExperienceData.title}
                onChange={(e) => setEditExperienceData({ ...editExperienceData, title: e.target.value })}
                className="col-span-3"
                placeholder="Senior Developer"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-experience-company" className="text-right">
                Company
              </Label>
              <Input
                id="edit-experience-company"
                value={editExperienceData.company}
                onChange={(e) => setEditExperienceData({ ...editExperienceData, company: e.target.value })}
                className="col-span-3"
                placeholder="Acme Inc."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-experience-duration" className="text-right">
                Duration
              </Label>
              <Input
                id="edit-experience-duration"
                value={editExperienceData.duration}
                onChange={(e) => setEditExperienceData({ ...editExperienceData, duration: e.target.value })}
                className="col-span-3"
                placeholder="Jan 2022 - Present"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-experience-type" className="text-right">
                Type
              </Label>
              <Input
                id="edit-experience-type"
                value={editExperienceData.type}
                onChange={(e) => setEditExperienceData({ ...editExperienceData, type: e.target.value })}
                className="col-span-3"
                placeholder="Full-time"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-experience-logo" className="text-right">
                Logo
              </Label>
              <div className="col-span-3 space-y-2">
                <Select
                  value={editExperienceData.organizationLogoKey || undefined}
                  onValueChange={(value) => setEditExperienceData({ ...editExperienceData, organizationLogoKey: value === "__none__" ? "" : value })}
                >
                  <SelectTrigger id="edit-experience-logo">
                    <SelectValue placeholder="Select organization logo" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORGANIZATION_LOGOS.map((logo) => (
                      <SelectItem key={logo.value} value={logo.value}>
                        {logo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editExperienceData.organizationLogoKey && (
                  <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Selected: {ORGANIZATION_LOGOS.find(l => l.value === editExperienceData.organizationLogoKey || (editExperienceData.organizationLogoKey === "" && l.value === "__none__"))?.label}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right mt-2">
                Roles
              </Label>
              <div className="col-span-3 space-y-2">
                {editExperienceData.role.map((role, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Textarea
                      value={role}
                      onChange={(e) => handleRoleChange(index, e.target.value, true)}
                      placeholder="Describe your responsibilities"
                      className="flex-1"
                    />
                    {editExperienceData.role.length > 1 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveRole(index, true)}
                        className="flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => handleAddRole(true)}
                  className="w-full mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Role
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-experience-order" className="text-right">
                Order
              </Label>
              <Input
                id="edit-experience-order"
                type="number"
                value={editExperienceData.order}
                onChange={(e) => setEditExperienceData({ ...editExperienceData, order: parseInt(e.target.value) || 0 })}
                className="col-span-3"
              />
            </div>
            {editExperienceError && (
              <div className="text-red-500 text-sm mt-2">{editExperienceError}</div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleEditExperience} disabled={isEditingExperience}>
              {isEditingExperience ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Experience Confirmation Dialog */}
      <AlertDialog open={!!experienceToDelete} onOpenChange={(open) => !open && setExperienceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the experience "{experienceToDelete?.title}" from your portfolio.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteExperienceError && (
            <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{deleteExperienceError}</span>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteExperience}
              disabled={isDeletingExperience}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeletingExperience ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}