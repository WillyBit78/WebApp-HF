import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Compresses an image Base64 string to drastically reduce payload size (usually < 40KB).
 * @param {string} base64Str - The raw data URL or base64 string
 * @param {number} maxWidth - Maximum target width (default 800px)
 * @param {number} quality - Image JPEG quality 0.0 - 1.0 (default 0.6)
 * @returns {Promise<string>} - Compressed Base64 string
 */
export const compressBase64Image = (base64Str, maxWidth = 800, quality = 0.6) => {
  return new Promise((resolve) => {
    if (!base64Str || typeof base64Str !== 'string') {
      return resolve(base64Str);
    }
    // If it's a PDF base64 or already short/URL, don't attempt canvas compression
    if (base64Str.startsWith('http') || base64Str.includes('application/pdf')) {
      return resolve(base64Str);
    }

    const img = new Image();
    img.src = base64Str;
    img.onerror = () => resolve(base64Str); // Fallback if image fails to load
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
  });
};

/**
 * Converts a Base64 string into a File object for Supabase Storage uploads.
 */
const base64ToFile = (base64Str, filename = 'upload.jpg') => {
  const arr = base64Str.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1] || arr[0]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

/**
 * Attempts to upload a file/base64 to Supabase Storage Bucket.
 * If Storage fails or bucket is not created, falls back to compressed Base64.
 * 
 * @param {string|File} fileInput - File object or Base64 string
 * @param {string} bucketName - 'receipts' or 'avatars'
 * @param {string} fileName - Destination filename inside bucket
 * @returns {Promise<string>} - Public URL if bucket upload succeeds, or compressed Base64 string
 */
export const uploadFileToStorage = async (fileInput, bucketName, fileName) => {
  if (!fileInput) return '';

  let compressedBase64 = '';
  let fileToUpload = null;

  if (typeof fileInput === 'string') {
    if (fileInput.startsWith('http')) {
      return fileInput; // Already a URL
    }
    compressedBase64 = await compressBase64Image(fileInput);
    try {
      fileToUpload = base64ToFile(compressedBase64, fileName);
    } catch (e) {
      console.warn('Failed to convert base64 to File for storage:', e);
    }
  } else if (fileInput instanceof File) {
    fileToUpload = fileInput;
  }

  // Try uploading to Supabase Storage if configured
  if (isSupabaseConfigured && supabase && fileToUpload) {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, fileToUpload, {
          cacheControl: '360000',
          upsert: true
        });

      if (!error && data?.path) {
        const { data: pubUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(data.path);
        
        if (pubUrlData?.publicUrl) {
          return pubUrlData.publicUrl;
        }
      }
    } catch (err) {
      console.warn(`Supabase Storage upload to bucket "${bucketName}" failed, using optimized Base64 fallback.`, err);
    }
  }

  // Fallback to compressed base64 string
  return compressedBase64 || fileInput;
};
