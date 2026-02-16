"use client"

import { useState } from 'react';
import { useCloudinaryUpload } from '@/hooks/use-cloudinary-upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, Trash2, CheckCircle } from 'lucide-react';
import Image from 'next/image';

interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

export default function TestUploadPage() {
  const { upload, uploadMultiple, deleteImage, uploading, progress } = useCloudinaryUpload();
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const handleSingleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await upload(file, 'gd-projects/test');
    if (result) {
      setUploadedImages(prev => [...prev, {
        url: result.url,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
      }]);
    }
  };

  const handleMultipleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const filesArray = Array.from(selectedFiles);
    const results = await uploadMultiple(filesArray, 'gd-projects/test');
    
    if (results.length > 0) {
      const newImages = results.map(result => ({
        url: result.url,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
      }));
      setUploadedImages(prev => [...prev, ...newImages]);
      setSelectedFiles(null);
    }
  };

  const handleDelete = async (publicId: string) => {
    const success = await deleteImage(publicId);
    if (success) {
      setUploadedImages(prev => prev.filter(img => img.publicId !== publicId));
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Cloudinary Upload Test</h1>
        <p className="text-muted-foreground">
          Test image uploads to Cloudinary for Graphic Design projects
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Single Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Single Image Upload</CardTitle>
            <CardDescription>Upload one image at a time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="single-upload">Choose Image</Label>
                <Input
                  id="single-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleSingleUpload}
                  disabled={uploading}
                  className="mt-2"
                />
              </div>
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
          </CardContent>
        </Card>

        {/* Multiple Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Multiple Images Upload</CardTitle>
            <CardDescription>Upload multiple images at once</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="multiple-upload">Choose Images</Label>
                <Input
                  id="multiple-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setSelectedFiles(e.target.files)}
                  disabled={uploading}
                  className="mt-2"
                />
              </div>
              {selectedFiles && selectedFiles.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                </p>
              )}
              <Button
                onClick={handleMultipleUpload}
                disabled={!selectedFiles || selectedFiles.length === 0 || uploading}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload {selectedFiles?.length || 0} Image{selectedFiles && selectedFiles.length > 1 ? 's' : ''}
              </Button>
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
          </CardContent>
        </Card>
      </div>

      {/* Uploaded Images Gallery */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Uploaded Images ({uploadedImages.length})
          </CardTitle>
          <CardDescription>
            Successfully uploaded images to Cloudinary
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uploadedImages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Upload className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No images uploaded yet. Try uploading some images above.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {uploadedImages.map((image, index) => (
                <div key={index} className="group relative">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={image.url}
                      alt={`Uploaded ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-mono truncate text-muted-foreground">
                      {image.publicId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {image.width} × {image.height}
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(image.publicId)}
                      className="w-full"
                    >
                      <Trash2 className="mr-2 h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Configuration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Cloud Name:</span>
              <code className="bg-muted px-2 py-1 rounded">
                {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'Not set'}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">API Endpoint:</span>
              <code className="bg-muted px-2 py-1 rounded">/api/upload/cloudinary</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Default Folder:</span>
              <code className="bg-muted px-2 py-1 rounded">gd-projects/test</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
