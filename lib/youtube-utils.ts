/**
 * Extracts YouTube video ID from various YouTube URL formats
 */
export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmedUrl = url.trim();
  if (trimmedUrl.length === 0) {
    return null;
  }

  // YouTube URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = trimmedUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Validates if a URL is a valid YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}

/**
 * Generates YouTube thumbnail URL from video ID
 * Returns the high-quality thumbnail (maxresdefault, or hqdefault as fallback)
 */
export function getYouTubeThumbnail(videoId: string): string {
  if (!videoId) {
    return '';
  }
  
  // Try maxresdefault first (highest quality), fallback to hqdefault
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

/**
 * Generates YouTube embed URL from video ID
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  if (!videoId) {
    return '';
  }
  
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Extracts video ID and generates thumbnail URL from YouTube URL
 */
export function getThumbnailFromUrl(youtubeUrl: string): string | null {
  const videoId = extractYouTubeId(youtubeUrl);
  if (!videoId) {
    return null;
  }
  
  return getYouTubeThumbnail(videoId);
}

