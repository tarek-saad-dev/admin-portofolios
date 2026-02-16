"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SortableImageList } from "./sortable-image-list"
import { Gallery, ImageMetadata } from "@/types/gd-project"
import { AlertCircle } from "lucide-react"

interface GalleryBuilderProps {
  gallery: Gallery
  mockups: ImageMetadata[]
  onChange: (gallery: Gallery, mockups: ImageMetadata[]) => void
}

export function GalleryBuilder({ gallery, mockups, onChange }: GalleryBuilderProps) {
  // Defensive fallbacks for undefined gallery properties
  const safeGallery: Gallery = {
    sliderImages: gallery?.sliderImages ?? [],
    verticalImages: gallery?.verticalImages ?? []
  }
  const safeMockups = mockups ?? []

  const handleSliderChange = (images: ImageMetadata[]) => {
    onChange({ ...safeGallery, sliderImages: images }, safeMockups)
  }

  const handleVerticalChange = (images: ImageMetadata[]) => {
    onChange({ ...safeGallery, verticalImages: images }, safeMockups)
  }

  const handleMockupsChange = (images: ImageMetadata[]) => {
    onChange(safeGallery, images)
  }

  const hasMinimumContent = safeGallery.sliderImages.length > 0 || safeGallery.verticalImages.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gallery Builder</CardTitle>
        <CardDescription>
          Create a Behance-style gallery with slider images, vertical flow images, and mockups.
          Drag to reorder images.
        </CardDescription>
        {!hasMinimumContent && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>At least one slider image OR one vertical image is required.</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="slider" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="slider">
              Slider Images ({safeGallery.sliderImages.length})
            </TabsTrigger>
            <TabsTrigger value="vertical">
              Vertical Flow ({safeGallery.verticalImages.length})
            </TabsTrigger>
            <TabsTrigger value="mockups">
              Mockups ({safeMockups.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="slider" className="mt-6">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Slider Images</p>
                <p>These images will appear in a carousel/slider at the top of the project viewer.</p>
              </div>
              <SortableImageList
                images={safeGallery.sliderImages}
                onChange={handleSliderChange}
                title="Slider Images"
                folder="gd-projects/gallery/slider"
                defaultAltPrefix="Slider"
              />
            </div>
          </TabsContent>

          <TabsContent value="vertical" className="mt-6">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Vertical Flow Images</p>
                <p>These images will be displayed in a vertical stacked layout, full-width.</p>
              </div>
              <SortableImageList
                images={safeGallery.verticalImages}
                onChange={handleVerticalChange}
                title="Vertical Flow Images"
                folder="gd-projects/gallery/vertical"
                defaultAltPrefix="Vertical"
              />
            </div>
          </TabsContent>

          <TabsContent value="mockups" className="mt-6">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Mockups</p>
                <p>Device mockups and presentation images displayed in a grid layout.</p>
              </div>
              <SortableImageList
                images={safeMockups}
                onChange={handleMockupsChange}
                title="Mockups"
                folder="gd-projects/mockups"
                defaultAltPrefix="Mockup"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
