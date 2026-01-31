"use client"

import { useState } from "react"
import { Plus, Trash2, AlertCircle, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tool } from "@/types/tool"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
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
import { addTool, deleteTool, editTool } from "@/services/tools-service"

interface ToolsListProps {
  tools: Tool[]
  isLoading: boolean
  selectedPortfolio: string
  getDbUriForPortfolio: (portfolioId: string) => string
  onToolAdded: (tool: Tool) => void
  onToolDeleted: (toolId: string) => void
  onToolEdited: (tool: Tool) => void
}

export function ToolsList({ 
  tools, 
  isLoading, 
  selectedPortfolio, 
  getDbUriForPortfolio,
  onToolAdded,
  onToolDeleted,
  onToolEdited
}: ToolsListProps) {
  const [isAddToolDialogOpen, setIsAddToolDialogOpen] = useState(false)
  const [isEditToolDialogOpen, setIsEditToolDialogOpen] = useState(false)
  const [newTool, setNewTool] = useState({
    name: "",
    category: "other",
    iconType: "none",
    iconName: "",
    description: ""
  })
  const [editingTool, setEditingTool] = useState<Tool | null>(null)
  const [editToolData, setEditToolData] = useState({
    name: "",
    category: "other",
    iconType: "none",
    iconName: "",
    description: ""
  })
  const [isAddingTool, setIsAddingTool] = useState(false)
  const [isEditingTool, setIsEditingTool] = useState(false)
  const [addToolError, setAddToolError] = useState<string | null>(null)
  const [editToolError, setEditToolError] = useState<string | null>(null)
  const [toolToDelete, setToolToDelete] = useState<Tool | null>(null)
  const [isDeletingTool, setIsDeletingTool] = useState(false)
  const [deleteToolError, setDeleteToolError] = useState<string | null>(null)

  const handleAddTool = async () => {
    if (!newTool.name.trim()) {
      setAddToolError("Tool name is required");
      return;
    }

    setIsAddingTool(true);
    setAddToolError(null);

    try {
      const dbUri = getDbUriForPortfolio(selectedPortfolio);
      if (!dbUri) {
        throw new Error("No database URI found for the selected portfolio");
      }

      const addedTool = await addTool(dbUri, selectedPortfolio, newTool);
      console.log("Tool added:", addedTool);

      onToolAdded(addedTool);

      setNewTool({
        name: "",
        category: "other",
        iconType: "none",
        iconName: "",
        description: ""
      });
      setIsAddToolDialogOpen(false);
    } catch (error: unknown) {
      console.error("Error adding tool:", error);
      setAddToolError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsAddingTool(false);
    }
  };

  const handleOpenEditDialog = (tool: Tool) => {
    setEditingTool(tool);
    setEditToolData({
      name: tool.name,
      category: tool.category,
      iconType: tool.iconType,
      iconName: tool.iconName,
      description: tool.description || ""
    });
    setIsEditToolDialogOpen(true);
  };

  const handleEditTool = async () => {
    if (!editingTool) return;
    if (!editToolData.name.trim()) {
      setEditToolError("Tool name is required");
      return;
    }

    setIsEditingTool(true);
    setEditToolError(null);

    try {
      const dbUri = getDbUriForPortfolio(selectedPortfolio);
      if (!dbUri) {
        throw new Error("No database URI found for the selected portfolio");
      }

      const updatedTool = await editTool(dbUri, selectedPortfolio, editingTool._id, editToolData);
      console.log("Tool updated:", updatedTool);

      onToolEdited(updatedTool);

      setEditingTool(null);
      setEditToolData({
        name: "",
        category: "other",
        iconType: "none",
        iconName: "",
        description: ""
      });
      setIsEditToolDialogOpen(false);
    } catch (error: unknown) {
      console.error("Error editing tool:", error);
      setEditToolError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsEditingTool(false);
    }
  };

  const handleDeleteTool = async () => {
    if (!toolToDelete) return;

    setIsDeletingTool(true);
    setDeleteToolError(null);

    try {
      const dbUri = getDbUriForPortfolio(selectedPortfolio);
      if (!dbUri) {
        throw new Error("No database URI found for the selected portfolio");
      }

      const result = await deleteTool(dbUri, selectedPortfolio, toolToDelete._id);
      console.log("Tool deleted:", result);

      onToolDeleted(toolToDelete._id);

      setToolToDelete(null);
    } catch (error: unknown) {
      console.error("Error deleting tool:", error);
      setDeleteToolError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsDeletingTool(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Tools</h2>
        <Button onClick={() => setIsAddToolDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tool
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : tools.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <div key={tool._id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => handleOpenEditDialog(tool)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setToolToDelete(tool)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-16">
                  <h3 className="font-medium">{tool.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{tool.category}</p>
                  {tool.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{tool.description}</p>
                  )}
                </div>
                {tool.iconType !== 'none' && (
                  <div className="h-10 w-10 flex items-center justify-center flex-shrink-0">
                    {tool.iconType === 'react-icon' ? (
                      <div className="bg-blue-100 text-blue-600 h-full w-full rounded-full flex items-center justify-center">
                        {tool.iconName ? tool.iconName.substring(0, 1) : ''}
                      </div>
                    ) : tool.iconType === 'custom-svg' ? (
                      <div className="bg-green-100 text-green-600 h-full w-full rounded-full flex items-center justify-center">
                        {tool.iconName ? tool.iconName.substring(0, 1) : ''}
                      </div>
                    ) : (
                      <div className="bg-gray-200 h-full w-full rounded-full flex items-center justify-center">
                        {tool.name.substring(0, 1)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No tools found for this portfolio. Add your first tool to get started.
        </div>
      )}

      <Dialog open={isAddToolDialogOpen} onOpenChange={setIsAddToolDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Tool</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tool-name" className="text-right">
                Name
              </Label>
              <Input
                id="tool-name"
                value={newTool.name}
                onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                className="col-span-3"
                placeholder="Adobe Premiere Pro"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tool-category" className="text-right">
                Category
              </Label>
              <Select
                value={newTool.category}
                onValueChange={(value) => setNewTool({ ...newTool, category: value })}
              >
                <SelectTrigger id="tool-category" className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="productivity">Productivity</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tool-icon-type" className="text-right">
                Icon Type
              </Label>
              <Select
                value={newTool.iconType}
                onValueChange={(value) => setNewTool({ ...newTool, iconType: value })}
              >
                <SelectTrigger id="tool-icon-type" className="col-span-3">
                  <SelectValue placeholder="Select an icon type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="react-icon">React Icon</SelectItem>
                  <SelectItem value="custom-svg">Custom SVG</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newTool.iconType !== 'none' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tool-icon-name" className="text-right">
                  Icon Name
                </Label>
                <Input
                  id="tool-icon-name"
                  value={newTool.iconName}
                  onChange={(e) => setNewTool({ ...newTool, iconName: e.target.value })}
                  className="col-span-3"
                  placeholder={newTool.iconType === 'react-icon' ? "SiAdobepremierepro" : "path/to/icon.svg"}
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="tool-description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="tool-description"
                value={newTool.description}
                onChange={(e) => setNewTool({ ...newTool, description: e.target.value })}
                className="col-span-3"
                placeholder="Optional description..."
                rows={3}
              />
            </div>
            {addToolError && (
              <div className="text-red-500 text-sm mt-2">{addToolError}</div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddTool} disabled={isAddingTool}>
              {isAddingTool ? "Adding..." : "Add Tool"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditToolDialogOpen} onOpenChange={setIsEditToolDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Tool</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-tool-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-tool-name"
                value={editToolData.name}
                onChange={(e) => setEditToolData({ ...editToolData, name: e.target.value })}
                className="col-span-3"
                placeholder="Adobe Premiere Pro"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-tool-category" className="text-right">
                Category
              </Label>
              <Select
                value={editToolData.category}
                onValueChange={(value) => setEditToolData({ ...editToolData, category: value })}
              >
                <SelectTrigger id="edit-tool-category" className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="productivity">Productivity</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-tool-icon-type" className="text-right">
                Icon Type
              </Label>
              <Select
                value={editToolData.iconType}
                onValueChange={(value) => setEditToolData({ ...editToolData, iconType: value })}
              >
                <SelectTrigger id="edit-tool-icon-type" className="col-span-3">
                  <SelectValue placeholder="Select an icon type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="react-icon">React Icon</SelectItem>
                  <SelectItem value="custom-svg">Custom SVG</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editToolData.iconType !== 'none' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-tool-icon-name" className="text-right">
                  Icon Name
                </Label>
                <Input
                  id="edit-tool-icon-name"
                  value={editToolData.iconName}
                  onChange={(e) => setEditToolData({ ...editToolData, iconName: e.target.value })}
                  className="col-span-3"
                  placeholder={editToolData.iconType === 'react-icon' ? "SiAdobepremierepro" : "path/to/icon.svg"}
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="edit-tool-description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="edit-tool-description"
                value={editToolData.description}
                onChange={(e) => setEditToolData({ ...editToolData, description: e.target.value })}
                className="col-span-3"
                placeholder="Optional description..."
                rows={3}
              />
            </div>
            {editToolError && (
              <div className="text-red-500 text-sm mt-2">{editToolError}</div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleEditTool} disabled={isEditingTool}>
              {isEditingTool ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toolToDelete} onOpenChange={(open) => !open && setToolToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the tool "{toolToDelete?.name}" from your portfolio.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteToolError && (
            <div className="flex items-center text-red-500 text-sm mt-2">
              <AlertCircle className="h-4 w-4 mr-2" />
              {deleteToolError}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingTool}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTool} 
              disabled={isDeletingTool}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeletingTool ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
