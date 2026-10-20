import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sniffType } from "@/lib/file-rules";

// Files live in private buckets. The database stores a reference like
// "storage:<bucket>/<path>"; readers get a short-lived signed link (storage rules decide who may read).
export const STORAGE_PREFIX = "storage:";
export type Bucket = "student-headshots" | "project-images" | "project-pdfs" | "gratitude-videos";

export function toStorageRef(bucket: Bucket, path: string) {
  return `${STORAGE_PREFIX}${bucket}/${path}`;
}

export function parseStorageRef(value: string | null | undefined): { bucket: string; path: string } | null {
  if (!value || !value.startsWith(STORAGE_PREFIX)) return null;
  const rest = value.slice(STORAGE_PREFIX.length);
  const slash = rest.indexOf("/");
  if (slash === -1) return null;
  return { bucket: rest.slice(0, slash), path: rest.slice(slash + 1) };
}

async function signedUrl(value: string) {
  const ref = parseStorageRef(value);
  if (!ref) return value;
  const { data, error } = await supabase.storage.from(ref.bucket).createSignedUrl(ref.path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

/** Returns a displayable URL for a stored file reference (or passes plain https URLs through). */
export function useFileUrl(value: string | null | undefined) {
  const isRef = !!parseStorageRef(value);
  const q = useQuery({
    queryKey: ["file-url", value],
    queryFn: () => signedUrl(value!),
    enabled: isRef,
    staleTime: 50 * 60_000,
    gcTime: 55 * 60_000,
  });
  if (!value) return null;
  if (!isRef) return value;
  return q.data ?? null;
}

export async function openStoredFile(value: string) {
  // Open the tab synchronously (avoids popup blockers), then point it at the signed link.
  const tab = window.open("", "_blank");
  const url = await signedUrl(value);
  if (!url) {
    tab?.close();
    throw new Error("FILE_UNAVAILABLE");
  }
  if (tab) {
    tab.opener = null;
    tab.location.href = url;
  } else window.location.href = url;
}

export async function readFileType(file: Blob) {
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  return sniffType(head);
}

/** Downscales a photo in the browser; falls back to the original file if the browser can't. */
export async function compressImage(file: File, maxDimension: number): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
    if (!blob || !["image/webp", "image/png", "image/jpeg"].includes(blob.type) || blob.size > file.size) return file;
    return blob;
  } catch {
    return file;
  }
}

export function extensionForMime(type: string) {
  return type === "image/webp" ? "webp" : type === "image/png" ? "png" : type === "application/pdf" ? "pdf" : "jpg";
}

/** Uploads to storage with progress reporting. Storage rules only accept the student's own folder. */
export async function uploadWithProgress(bucket: Bucket, path: string, file: Blob, onProgress: (percent: number) => void) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("NOT_AUTHENTICATED");
  const base = import.meta.env["VITE_SUPABASE_URL"] as string;
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string;
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${base}/storage/v1/object/${bucket}/${encodedPath}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", key);
    xhr.setRequestHeader("x-upsert", "true");
    xhr.setRequestHeader("cache-control", "3600");
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`UPLOAD_${xhr.status}`)));
    xhr.onerror = () => reject(new Error("UPLOAD_NETWORK"));
    xhr.send(file);
  });
  onProgress(100);
  return toStorageRef(bucket, path);
}
