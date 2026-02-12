"use client"

import { useState } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

interface ImageEditorProps {
  url: string
  alt: string
  width: number
  height: number
  caption?: string
  onChange: (data: { url: string; alt: string; width: number; height: number; caption?: string }) => void
  showCaption?: boolean
  required?: boolean
}

export function ImageEditor({
  url,
  alt,
  width,
  height,
  caption,
  onChange,
  showCaption = false,
  required = false,
}: ImageEditorProps) {
  const [imageError, setImageError] = useState(false)

  const handleChange = (field: string, value: string | number) => {
    onChange({
      url,
      alt,
      width,
      height,
      caption,
      [field]: value,
    })
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="url">
            Image URL {required && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="url"
            type="url"
            value={url}
            onChange={(e) => handleChange("url", e.target.value)}
            placeholder="https://example.com/image.jpg"
            required={required}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="width">
              Width (px) {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="width"
              type="number"
              min="1"
              value={width || ""}
              onChange={(e) => handleChange("width", parseInt(e.target.value) || 0)}
              placeholder="1920"
              required={required}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="height">
              Height (px) {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="height"
              type="number"
              min="1"
              value={height || ""}
              onChange={(e) => handleChange("height", parseInt(e.target.value) || 0)}
              placeholder="1080"
              required={required}
            />
          </div>
        </div>

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
