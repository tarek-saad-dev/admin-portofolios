import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface UploadResult {
  success: boolean;
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  resourceType: string;
  bytes: number;
}

interface UseCloudinaryUploadReturn {
  upload: (file: File, folder?: string) => Promise<UploadResult | null>;
  uploadMultiple: (files: File[], folder?: string) => Promise<UploadResult[]>;
  deleteImage: (publicId: string) => Promise<boolean>;
  uploading: boolean;
  progress: number;
}

/**
 * Custom hook for uploading images to Cloudinary
 * Provides upload, uploadMultiple, and deleteImage functions
 */
export function useCloudinaryUpload(): UseCloudinaryUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  /**
   * Upload a single file to Cloudinary
   */
  const upload = async (
    file: File,
    folder: string = 'gd-projects'
  ): Promise<UploadResult | null> => {
    try {
      setUploading(true);
      setProgress(0);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      setProgress(50);

      const response = await fetch('/api/upload/cloudinary', {
        method: 'POST',
        body: formData,
      });

      setProgress(75);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      setProgress(100);

      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });

      return result.data;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  /**
   * Upload multiple files to Cloudinary
   */
  const uploadMultiple = async (
    files: File[],
    folder: string = 'gd-projects'
  ): Promise<UploadResult[]> => {
    try {
      setUploading(true);
      setProgress(0);

      const uploadPromises = files.map(async (file, index) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        const response = await fetch('/api/upload/cloudinary', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const result = await response.json();
        
        // Update progress
        const currentProgress = ((index + 1) / files.length) * 100;
        setProgress(currentProgress);

        return result.data;
      });

      const results = await Promise.all(uploadPromises);

      toast({
        title: 'Success',
        description: `${results.length} image${results.length > 1 ? 's' : ''} uploaded successfully`,
      });

      return results;
    } catch (error) {
      console.error('Multiple upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload images',
        variant: 'destructive',
      });
      return [];
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  /**
   * Delete an image from Cloudinary
   */
  const deleteImage = async (publicId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/upload/cloudinary?publicId=${encodeURIComponent(publicId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Delete failed');
      }

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Image deleted successfully',
        });
      }

      return result.success;
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete image',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    upload,
    uploadMultiple,
    deleteImage,
    uploading,
    progress,
  };
}
