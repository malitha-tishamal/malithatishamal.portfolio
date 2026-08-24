import axios from "axios";

export const CLOUDINARY_CLOUD_NAME = "dqeptzlsb";
export const CLOUDINARY_UPLOAD_PRESET = "flutter_mediq_upload";

export interface CloudinaryUploadResponse {
  url: string;
  secure_url: string;
  public_id: string;
  original_filename: string;
  format: string;
  resource_type: string;
  bytes: number;
}

export const uploadToCloudinary = async (
  file: File,
  onProgress?: (percent: number) => void,
  resourceType: "auto" | "image" | "raw" = "auto"
): Promise<CloudinaryUploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

  const response = await axios.post<CloudinaryUploadResponse>(endpoint, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });

  return response.data;
};
