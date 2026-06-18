import { useState } from "react";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

export interface UploadResult {
  url: string;
  type: "image" | "video";
}

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File, userId: string): Promise<UploadResult | null> => {
    setIsUploading(true);
    setError(null);
    try {
      const type = file.type.startsWith("video/") ? "video" : "image";
      
      // Check for Cloudinary Credentials in dynamic environment setup
      const hasCloudinary = 
        (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME && 
        (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET;

      if (hasCloudinary) {
        // Cloudinary Integration (Optimized Image/Video Handling Service)
        const cloudName = (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME;
        const preset = (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET;
        
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", preset);
        
        // Auto-resizing for images (using Cloudinary dynamic options)
        if (type === "image") {
          formData.append("folder", `vyntra_posts/${userId}`);
        }

        const url = `https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`;
        const response = await fetch(url, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload to Cloudinary server.");
        }

        const data = await response.json();
        setIsUploading(false);
        return {
          url: data.secure_url || data.url,
          type
        };
      } else {
        // Safe, compliant Fallback to Firebase Storage
        const fileRef = storageRef(storage, `post_media/${userId}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        const url = await getDownloadURL(snapshot.ref);
        setIsUploading(false);
        return {
          url,
          type: type as "image" | "video"
        };
      }
    } catch (err: any) {
      console.error("Upload error detailed:", err);
      setError(err?.message || "Upload operation failed.");
      setIsUploading(false);
      return null;
    }
  };

  return { uploadFile, isUploading, error };
}
