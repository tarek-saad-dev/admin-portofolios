# Cloudinary Integration Setup Guide

## ✅ Configuration Complete

Cloudinary has been successfully integrated into the Admin application for uploading images in Graphic Design projects.

---

## 🔐 Environment Variables

### **IMPORTANT: Update Your Cloud Name**

Open `.env.local` and replace `your_cloud_name_here` with your actual Cloudinary cloud name:

```env
# Cloudinary Configuration (for image uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_actual_cloud_name  # ⚠️ UPDATE THIS!
CLOUDINARY_API_KEY=286345284369145
CLOUDINARY_API_SECRET=MH6qJ-qqSLyKgir2eLk3ytdvE9c
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=gd_projects_preset
```

### **How to Find Your Cloud Name:**
1. Log in to your Cloudinary dashboard
2. Go to **Dashboard** → **Account Details**
3. Copy your **Cloud Name**
4. Paste it in `.env.local`

---

## 📦 Installed Packages

```bash
✅ cloudinary (v2) - Installed successfully
```

---

## 📁 Files Created

### **1. Configuration**
- **`lib/cloudinary.ts`** - Cloudinary SDK configuration and utility functions
  - `uploadToCloudinary()` - Upload single image
  - `deleteFromCloudinary()` - Delete image
  - `uploadMultipleToCloudinary()` - Upload multiple images
  - `getTransformedUrl()` - Generate transformation URLs

### **2. API Routes**
- **`app/api/upload/cloudinary/route.ts`** - Next.js API route for uploads
  - `POST /api/upload/cloudinary` - Upload images
  - `DELETE /api/upload/cloudinary?publicId=xxx` - Delete images
  - Supports both multipart/form-data and JSON with base64

### **3. Client Hooks**
- **`hooks/use-cloudinary-upload.ts`** - React hook for easy uploads
  - `upload(file, folder)` - Upload single file
  - `uploadMultiple(files, folder)` - Upload multiple files
  - `deleteImage(publicId)` - Delete image
  - `uploading` - Loading state
  - `progress` - Upload progress (0-100)

### **4. Test Page**
- **`app/test-upload/page.tsx`** - Test page to verify uploads work
  - Single image upload
  - Multiple images upload
  - Image gallery with delete
  - Configuration status display

---

## 🧪 Testing the Integration

### **Step 1: Update Cloud Name**
Make sure you've updated `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` in `.env.local`

### **Step 2: Restart Development Server**
```bash
npm run dev
```

### **Step 3: Visit Test Page**
Navigate to: **http://localhost:3001/test-upload**

### **Step 4: Test Upload**
1. Click "Choose Image" under Single Image Upload
2. Select an image from your computer
3. Wait for upload to complete
4. Image should appear in the gallery below
5. Try uploading multiple images
6. Try deleting an image

### **Expected Results:**
- ✅ Image uploads successfully
- ✅ Progress bar shows upload progress
- ✅ Success toast notification appears
- ✅ Image appears in gallery with Cloudinary URL
- ✅ Delete button removes image from Cloudinary

---

## 🔧 Cloudinary Dashboard Setup (Optional but Recommended)

### **Create Upload Preset:**
1. Go to **Settings** → **Upload**
2. Click **Add upload preset**
3. Set **Preset name**: `gd_projects_preset`
4. Set **Signing Mode**: `Unsigned` (for client-side uploads)
5. Set **Folder**: `gd-projects`
6. **Save**

This allows direct client-side uploads without going through your API (optional).

---

## 💻 Usage in Your Components

### **Example 1: Simple Upload**
```typescript
import { useCloudinaryUpload } from '@/hooks/use-cloudinary-upload';

function MyComponent() {
  const { upload, uploading } = useCloudinaryUpload();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await upload(file, 'gd-projects/covers');
    if (result) {
      console.log('Uploaded:', result.url);
      // Use result.url for your image
    }
  };

  return (
    <input 
      type="file" 
      onChange={handleUpload} 
      disabled={uploading}
    />
  );
}
```

### **Example 2: Multiple Upload with Progress**
```typescript
import { useCloudinaryUpload } from '@/hooks/use-cloudinary-upload';

function GalleryUpload() {
  const { uploadMultiple, uploading, progress } = useCloudinaryUpload();
  const [images, setImages] = useState([]);

  const handleUpload = async (files: FileList) => {
    const results = await uploadMultiple(
      Array.from(files), 
      'gd-projects/gallery'
    );
    
    setImages(results.map(r => ({
      url: r.url,
      width: r.width,
      height: r.height,
      alt: ''
    })));
  };

  return (
    <>
      <input type="file" multiple onChange={(e) => {
        if (e.target.files) handleUpload(e.target.files);
      }} />
      {uploading && <Progress value={progress} />}
    </>
  );
}
```

### **Example 3: Delete Image**
```typescript
const { deleteImage } = useCloudinaryUpload();

const handleDelete = async (publicId: string) => {
  const success = await deleteImage(publicId);
  if (success) {
    // Remove from your state
  }
};
```

---

## 📂 Folder Structure in Cloudinary

Recommended folder organization:
```
gd-projects/
├── covers/          # Cover images
├── gallery/         # Gallery slider images
│   ├── slider/      # Slider images
│   └── vertical/    # Vertical flow images
├── mockups/         # Device mockups
└── test/            # Test uploads (can delete later)
```

---

## 🔒 Security Notes

### **Environment Variables:**
- ✅ `CLOUDINARY_API_KEY` - Server-side only (not exposed to client)
- ✅ `CLOUDINARY_API_SECRET` - Server-side only (not exposed to client)
- ✅ `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - Client-side (safe to expose)
- ✅ `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` - Client-side (safe to expose)

### **Upload Flow:**
1. Client selects file
2. File sent to `/api/upload/cloudinary` (your Next.js API)
3. API uploads to Cloudinary using server-side credentials
4. Cloudinary URL returned to client

This keeps your API secret secure on the server.

---

## 🎨 Image Transformations

Cloudinary supports powerful image transformations:

```typescript
import { getTransformedUrl } from '@/lib/cloudinary';

// Resize to 800x600
const url = getTransformedUrl('gd-projects/image123', {
  width: 800,
  height: 600,
  crop: 'fill'
});

// Auto-optimize quality and format
const optimized = getTransformedUrl('gd-projects/image123', {
  quality: 'auto:good',
  format: 'auto'
});
```

---

## 🐛 Troubleshooting

### **Issue: "Cloud name not set" error**
**Solution:** Update `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` in `.env.local` and restart dev server

### **Issue: Upload fails with 401 Unauthorized**
**Solution:** Verify your API Key and Secret are correct in `.env.local`

### **Issue: Images not appearing**
**Solution:** Check browser console for CORS errors. Cloudinary should allow all origins by default.

### **Issue: "Cannot find module 'cloudinary'"**
**Solution:** Run `npm install cloudinary`

### **Issue: Upload works but delete fails**
**Solution:** Ensure the publicId includes the full path (e.g., `gd-projects/test/image123`)

---

## 📊 Monitoring Uploads

### **Cloudinary Dashboard:**
1. Go to **Media Library**
2. Navigate to `gd-projects` folder
3. View all uploaded images
4. Check storage usage
5. Monitor transformations

### **Console Logging:**
All upload/delete operations log to the console:
- ✅ Success: Shows URL and metadata
- ❌ Error: Shows error message

---

## 🚀 Next Steps

### **1. Test the Integration**
- Visit http://localhost:3001/test-upload
- Upload test images
- Verify they appear in Cloudinary dashboard
- Test delete functionality

### **2. Integrate with GD Projects**
Once tested, integrate the upload hook into:
- Cover image upload in GD Project form
- Gallery builder (slider images)
- Gallery builder (vertical images)
- Mockups upload

### **3. Update Image Editor Component**
Replace any existing image upload logic with `useCloudinaryUpload` hook

---

## ✅ Checklist

Before going to production:

- [ ] Update `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` in `.env.local`
- [ ] Test single image upload
- [ ] Test multiple image upload
- [ ] Test image delete
- [ ] Verify images appear in Cloudinary dashboard
- [ ] Create upload preset in Cloudinary (optional)
- [ ] Set up folder structure in Cloudinary
- [ ] Test in production environment
- [ ] Add `.env.local` to `.gitignore` (should already be there)
- [ ] Add production environment variables to hosting platform

---

## 📝 API Reference

### **Upload Single Image**
```typescript
POST /api/upload/cloudinary
Content-Type: multipart/form-data

FormData:
  - file: File
  - folder: string (optional, default: 'gd-projects')
  - publicId: string (optional)

Response:
{
  success: true,
  data: {
    url: string,
    publicId: string,
    width: number,
    height: number,
    format: string,
    bytes: number
  }
}
```

### **Delete Image**
```typescript
DELETE /api/upload/cloudinary?publicId=gd-projects/test/image123

Response:
{
  success: true,
  message: "Image deleted successfully"
}
```

---

## 🎉 Status: Ready for Testing

The Cloudinary integration is fully configured and ready to test. Visit the test page to verify everything works correctly before integrating into the GD Projects module.

**Test URL:** http://localhost:3001/test-upload
