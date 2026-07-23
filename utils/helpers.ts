// utils/helpers.ts

export const getImageUri = (imageData: string | null | undefined): string | null => {
  if (!imageData || imageData.trim() === '') {
    return null;
  }
  if (imageData.startsWith('http') || imageData.startsWith('data:')) {
    return imageData;
  }
  return `data:image/jpeg;base64,${imageData}`;
};

export const getVideoUri = (videoData: string | null | undefined): string | null => {
  if (!videoData || videoData.trim() === '') {
    return null;
  }
  // Already a remote URL or properly prefixed data URI — use as-is
  if (videoData.startsWith('http') || videoData.startsWith('data:')) {
    return videoData;
  }
  // Raw base64 string — wrap with mp4 data URI prefix so the player can decode it
  return `data:video/mp4;base64,${videoData}`;
};