"use client"

import { useState } from "react"
import Image from "next/image"
import { Upload, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useCloudinaryUpload } from "@/hooks/use-cloudinary-upload"

interface ImageEditorProps {
  url: string
  alt: string
  width: number
  height: number
  caption?: string
  publicId?: string
  onChange: (data: { url: string; alt: string; width: number; height: number; caption?: string; publicId?: string }) => void
  showCaption?: boolean
  required?: boolean
  label?: string
  folder?: string
  defaultAlt?: string
}

export function ImageEditor({
  url,
  alt,
  width,
  height,
  caption,
  publicId,
  onChange,
  showCaption = false,
  required = false,
  label = "Image",
  folder = "gd-projects",
  defaultAlt = "",
}: ImageEditorProps) {
  const [imageError, setImageError] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const { upload, uploading, progress } = useCloudinaryUpload()

  const handleChange = (field: string, value: string | number) => {
    onChange({
      url,
      alt,
      width,
      height,
      caption,
      publicId,
      [field]: value,
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('Invalid file type. Please upload JPG, PNG, or WebP images.')
      return
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert('File too large. Maximum size is 10MB.')
      return
    }

    const result = await upload(file, folder)
    if (result) {
      onChange({
        url: result.url,
        alt: defaultAlt || alt || label,
        width: result.width,
        height: result.height,
        caption,
        publicId: result.publicId,
      })
      setImageError(false)
    }

    // Reset file input
    e.target.value = ''
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Upload Button */}
        <div className="space-y-2">
          <Label>{label} {required && <span className="text-red-500">*</span>}</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={uploading}
              onClick={() => document.getElementById(`file-upload-${label}`)?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowManualInput(!showManualInput)}
            >
              {showManualInput ? 'Hide' : 'Manual URL'}
            </Button>
          </div>
          <input
            id={`file-upload-${label}`}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </div>

        {/* Manual URL Input (Optional) */}
        {showManualInput && (
          <div className="space-y-2">
            <Label htmlFor="url">Image URL (Advanced)</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => handleChange("url", e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        )}

        {/* Dimensions (Auto-filled from upload or manual) */}
        {showManualInput && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Width (px)</Label>
              <Input
                id="width"
                type="number"
                min="1"
                value={width || ""}
                onChange={(e) => handleChange("width", parseInt(e.target.value) || 0)}
                placeholder="1920"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Height (px)</Label>
              <Input
                id="height"
                type="number"
                min="1"
                value={height || ""}
                onChange={(e) => handleChange("height", parseInt(e.target.value) || 0)}
                placeholder="1080"
              />
            </div>
          </div>
        )}

        {/* Show dimensions as readonly when uploaded */}
        {!showManualInput && width > 0 && height > 0 && (
          <div className="text-sm text-muted-foreground">
            Dimensions: {width} × {height} px
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="alt">
            Alt Text {required && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="alt"
            type="text"
            value={alt}
            onChange={(e) => handleChange("alt", e.target.value)}
            placeholder="Descriptive text for accessibility"
            required={required}
          />
        </div>

        {showCaption && (
          <div className="space-y-2">
            <Label htmlFor="caption">Caption (optional)</Label>
            <Input
              id="caption"
              type="text"
              value={caption || ""}
              onChange={(e) => handleChange("caption", e.target.value)}
              placeholder="Optional caption for this image"
            />
          </div>
        )}

        {url && !imageError && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden">
              <Image
                src={url}
                alt={alt || "Preview"}
                fill
                className="object-contain"
                unoptimized
                onError={() => setImageError(true)}
              />
            </div>
          </div>
        )}

        {imageError && url && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
            Failed to load image. Please check the URL.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
