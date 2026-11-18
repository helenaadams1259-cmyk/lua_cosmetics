// Image upload service. Currently stores files as base64 data URLs locally.
// Swap the body of `uploadImage` with a real API call later without touching UI.

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

export function isValidImageFile(file: File): boolean {
  if (ACCEPTED_IMAGE_TYPES.includes(file.type)) return true;
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export type UploadProgress = (percent: number) => void;

export async function uploadImage(file: File, onProgress?: UploadProgress): Promise<string> {
  // Mock upload: read as data URL with simulated progress.
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    reader.onload = () => {
      onProgress?.(100);
      resolve(String(reader.result));
    };
    reader.onerror = () => reject(new Error("Không thể đọc file ảnh"));
    reader.readAsDataURL(file);
  });
}

export async function uploadImages(files: File[], onProgress?: UploadProgress): Promise<string[]> {
  const results: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const url = await uploadImage(files[i], (p) => {
      const overall = Math.round(((i + p / 100) / files.length) * 100);
      onProgress?.(overall);
    });
    results.push(url);
  }
  return results;
}
