export interface ParsedVideo {
  type: 'youtube' | 'vimeo' | 'direct' | 'iframe' | 'invalid';
  embedUrl: string;
  videoId?: string;
  originalUrl: string;
}

export function parseVideoUrl(url?: string): ParsedVideo {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { type: 'invalid', embedUrl: '', originalUrl: '' };
  }

  const trimmed = url.trim();

  // YouTube formats:
  // https://www.youtube.com/watch?v=dQw4w9WgXcQ
  // https://youtu.be/dQw4w9WgXcQ
  // https://www.youtube.com/embed/dQw4w9WgXcQ
  // https://www.youtube.com/shorts/dQw4w9WgXcQ
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&playsinline=1`,
      originalUrl: trimmed
    };
  }

  // Vimeo formats:
  // https://vimeo.com/76979871
  // https://player.vimeo.com/video/76979871
  // https://vimeo.com/channels/staffpicks/76979871
  const vimeoMatch = trimmed.match(/(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|album\/(?:\d+\/)?video\/|video\/|)(\d+)|player\.vimeo\.com\/video\/(\d+))/i);
  if (vimeoMatch && (vimeoMatch[1] || vimeoMatch[2])) {
    const videoId = vimeoMatch[1] || vimeoMatch[2];
    return {
      type: 'vimeo',
      videoId,
      embedUrl: `https://player.vimeo.com/video/${videoId}?dnt=1&title=0&byline=0&portrait=0&badge=0&autopause=0`,
      originalUrl: trimmed
    };
  }

  // Direct video file
  if (trimmed.endsWith('.mp4') || trimmed.endsWith('.webm') || trimmed.endsWith('.mov') || trimmed.startsWith('data:video')) {
    return {
      type: 'direct',
      embedUrl: trimmed,
      originalUrl: trimmed
    };
  }

  // If already an iframe embed URL
  if (trimmed.startsWith('https://') && (trimmed.includes('embed') || trimmed.includes('player'))) {
    return {
      type: 'iframe',
      embedUrl: trimmed,
      originalUrl: trimmed
    };
  }

  return {
    type: 'invalid',
    embedUrl: trimmed,
    originalUrl: trimmed
  };
}
