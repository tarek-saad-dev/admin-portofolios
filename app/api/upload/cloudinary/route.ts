import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';

/**
 * POST /api/upload/cloudinary
 * Upload an image to Cloudinary
 * Accepts: multipart/form-data or JSON with base64 data
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let fileData: string;
    let folder = 'gd-projects';
    let publicId: string | undefined;

    // Handle multipart/form-data (file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      folder = (formData.get('folder') as string) || 'gd-projects';
      publicId = (formData.get('publicId') as string) || undefined;

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }

      // Convert file to base64
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      fileData = `data:${file.type};base64,${buffer.toString('base64')}`;
    }
    // Handle JSON with base64 data
    else if (contentType.includes('application/json')) {
      const body = await request.json();
      fileData = body.file;
      folder = body.folder || 'gd-projects';
      publicId = body.publicId;

      if (!fileData) {
        return NextResponse.json(
          { error: 'No file data provided' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid content type. Use multipart/form-data or application/json' },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(fileData, folder, publicId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to upload image',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload/cloudinary
 * Delete an image from Cloudinary
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get('publicId');

    if (!publicId) {
      return NextResponse.json(
        { error: 'Public ID is required' },
        { status: 400 }
      );
    }

    const result = await deleteFromCloudinary(publicId);

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Image deleted successfully' : 'Failed to delete image',
    });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete image',
      },
      { status: 500 }
    );
  }
}
