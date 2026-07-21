import { apiRequest } from "./client";

type UploadUrlResponse = {
  imageKey: string;
  uploadUrl: string;
};

function getContainer(file: File): string {
  const fromType = file.type.split("/")[1]?.toLowerCase();
  const normalized = fromType === "jpeg" ? "jpg" : fromType;
  if (normalized && ["jpg", "png", "webp"].includes(normalized)) {
    return normalized;
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext && ["jpg", "jpeg", "png", "webp"].includes(ext)) {
    return ext === "jpeg" ? "jpg" : ext;
  }

  return "png";
}

async function getUploadUrl(name: string, container: string): Promise<UploadUrlResponse> {
  return apiRequest<UploadUrlResponse>("/api/v1/images/upload", {
    method: "POST",
    body: JSON.stringify({ name, container }),
  });
}

async function uploadToPresignedUrl(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
  });

  if (!response.ok) {
    throw new Error(`上传失败: ${response.status}`);
  }
}

async function getImageUrl(imageKey: string): Promise<{ url: string }> {
  return apiRequest<{ url: string }>(
    `/api/v1/images/url/${encodeURIComponent(imageKey)}`
  );
}

export async function uploadWorkflowImage(file: File): Promise<string> {
  const container = getContainer(file);
  const { imageKey, uploadUrl } = await getUploadUrl(file.name, container);
  await uploadToPresignedUrl(uploadUrl, file);
  const { url } = await getImageUrl(imageKey);
  return url;
}
