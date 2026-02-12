"use client"

import { useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Trash2, Plus } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageMetadata } from "@/types/gd-project"

interface SortableImageItemProps {
  image: ImageMetadata & { id: string }
  onUpdate: (data: Partial<ImageMetadata>) => void
  onRemove: () => void
}

function SortableImageItem({ image, onUpdate, onRemove }: SortableImageItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const [imageError, setImageError] = useState(false)

  return (
    <div ref={setNodeRef} style={style} className="bg-background">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="cursor-grab active:cursor-grabbing touch-none"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>
            <CardTitle className="text-sm flex-1">Image {image.order || 0}</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Image URL *</Label>
            <Input
              type="url"
              value={image.url}
              onChange={(e) => onUpdate({ url: e.target.value })}
              placeholder="https://example.com/image.jpg"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Width (px) *</Label>
              <Input
                type="number"
                min="1"
                value={image.width || ""}
                onChange={(e) => onUpdate({ width: parseInt(e.target.value) || 0 })}
                placeholder="1920"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Height (px) *</Label>
              <Input
                type="number"
                min="1"
                value={image.height || ""}
                onChange={(e) => onUpdate({ height: parseInt(e.target.value) || 0 })}
                placeholder="1080"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Alt Text *</Label>
            <Input
              type="text"
              value={image.alt}
              onChange={(e) => onUpdate({ alt: e.target.value })}
              placeholder="Descriptive text for accessibility"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Caption (optional)</Label>
            <Input
              type="text"
              value={image.caption || ""}
              onChange={(e) => onUpdate({ caption: e.target.value })}
              placeholder="Optional caption"
            />
          </div>

          {image.url && !imageError && (
            <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden">
              <Image
                src={image.url}
                alt={image.alt || "Preview"}
                fill
                className="object-contain"
                unoptimized
                onError={() => setImageError(true)}
              />
            </div>
          )}

          {imageError && image.url && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
              Failed to load image
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface SortableImageListProps {
  images: ImageMetadata[]
  onChange: (images: ImageMetadata[]) => void
  title?: string
}

export function SortableImageList({ images, onChange, title }: SortableImageListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const imagesWithIds = images.map((img, index) => ({
    ...img,
    id: `image-${index}`,
    order: index + 1,
  }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = imagesWithIds.findIndex((img) => img.id === active.id)
      const newIndex = imagesWithIds.findIndex((img) => img.id === over.id)

      const reordered = arrayMove(imagesWithIds, oldIndex, newIndex)
      const updatedImages = reordered.map((img, index) => {
        const { id: _id, ...rest } = img
        return { ...rest, order: index + 1 }
      })
      onChange(updatedImages)
    }
  }

  const handleAdd = () => {
    const newImage: ImageMetadata = {
      url: "",
      alt: "",
      width: 0,
      height: 0,
      caption: "",
      order: images.length + 1,
    }
    onChange([...images, newImage])
  }

  const handleUpdate = (index: number, data: Partial<ImageMetadata>) => {
    const updated = [...images]
    updated[index] = { ...updated[index], ...data }
    onChange(updated)
  }

  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index)
    const reordered = updated.map((img, i) => ({ ...img, order: i + 1 }))
    onChange(reordered)
  }

  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-semibold">{title}</h3>}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={imagesWithIds.map((img) => img.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {imagesWithIds.map((image, index) => (
              <SortableImageItem
                key={image.id}
                image={image}
                onUpdate={(data) => handleUpdate(index, data)}
                onRemove={() => handleRemove(index)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button type="button" variant="outline" onClick={handleAdd} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Image
      </Button>

      {images.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No images yet. Click &quot;Add Image&quot; to get started.
        </p>
      )}
    </div>
  )
}
