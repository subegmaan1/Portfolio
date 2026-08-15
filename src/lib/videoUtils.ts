export interface ParsedVideo {
  type: 'youtube' | 'vimeo' | 'direct' | 'iframe' | 'invalid';
  embedUrl: string;
  videoId?: string;
  privacyHash?: string;
  originalUrl: string;
  isEmbedCode?: boolean;
}

export function extractSrcFromIframe(htmlString: string): string | null {
  if (!htmlString || typeof htmlString !== 'string') return null;
  // Match src="..." or src='...'
  const match = htmlString.match(/src=["']([^"']+)["']/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
}

export function parseVideoUrl(input?: string): ParsedVideo {
  if (!input || typeof input !== 'string' || !input.trim()) {
    return { type: 'invalid', embedUrl: '', originalUrl: '' };
  }

  const raw = input.trim();
  const isEmbedCode = raw.includes('<iframe') || raw.includes('<embed') || raw.includes('<video');
  
  // Extract iframe src if embed HTML code was pasted
  let processedUrl = raw;
  if (isEmbedCode) {
    const extractedSrc = extractSrcFromIframe(raw);
    if (extractedSrc) {
      processedUrl = extractedSrc;
    }
  }

  // Handle leading/trailing quotes or whitespace
  processedUrl = processedUrl.replace(/^["']|["']$/g, '').trim();

  // 1. YouTube formats:
  // - https://www.youtube.com/watch?v=dQw4w9WgXcQ
  // - https://youtu.be/dQw4w9WgXcQ
  // - https://www.youtube.com/embed/dQw4w9WgXcQ
  // - https://www.youtube.com/shorts/dQw4w9WgXcQ
  // - <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"...></iframe>
  const ytMatch = processedUrl.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&playsinline=1`,
      originalUrl: raw,
      isEmbedCode
    };
  }

  // 2. Vimeo unlisted URL with privacy hash:
  // e.g. https://vimeo.com/1057123456/a1b2c3d4e5
  const vimeoUnlistedMatch = processedUrl.match(/vimeo\.com\/(\d+)\/([a-zA-Z0-9]+)/i);
  if (vimeoUnlistedMatch && vimeoUnlistedMatch[1] && vimeoUnlistedMatch[2]) {
    const videoId = vimeoUnlistedMatch[1];
    const privacyHash = vimeoUnlistedMatch[2];
    return {
      type: 'vimeo',
      videoId,
      privacyHash,
      embedUrl: `https://player.vimeo.com/video/${videoId}?h=${privacyHash}&dnt=1&title=0&byline=0&portrait=0&badge=0&autopause=0`,
      originalUrl: raw,
      isEmbedCode
    };
  }

  // 3. Vimeo Player URL (with optional ?h=hash or query params)
  // e.g. https://player.vimeo.com/video/1057123456?h=a1b2c3d4e5&badge=0
  const vimeoPlayerMatch = processedUrl.match(/player\.vimeo\.com\/video\/(\d+)/i);
  if (vimeoPlayerMatch && vimeoPlayerMatch[1]) {
    const videoId = vimeoPlayerMatch[1];
    const hashMatch = processedUrl.match(/[?&]h=([a-zA-Z0-9]+)/i);
    const privacyHash = hashMatch ? hashMatch[1] : undefined;
    const hashParam = privacyHash ? `h=${privacyHash}&` : '';
    return {
      type: 'vimeo',
      videoId,
      privacyHash,
      embedUrl: `https://player.vimeo.com/video/${videoId}?${hashParam}dnt=1&title=0&byline=0&portrait=0&badge=0&autopause=0`,
      originalUrl: raw,
      isEmbedCode
    };
  }

  // 4. Standard Vimeo URLs:
  // - https://vimeo.com/76979871
  // - https://vimeo.com/channels/staffpicks/76979871
  // - https://vimeo.com/groups/motion/videos/76979871
  // - https://vimeo.com/showcase/12345/video/76979871
  // - https://vimeo.com/manage/videos/76979871
  const vimeoMatch = processedUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|showcase\/(?:\d+\/)?video\/|album\/(?:\d+\/)?video\/|manage\/videos\/|video\/|)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1];
    return {
      type: 'vimeo',
      videoId,
      embedUrl: `https://player.vimeo.com/video/${videoId}?dnt=1&title=0&byline=0&portrait=0&badge=0&autopause=0`,
      originalUrl: raw,
      isEmbedCode
    };
  }

  // 5. Direct video file (.mp4, .webm, .mov, data:video)
  if (
    processedUrl.endsWith('.mp4') ||
    processedUrl.endsWith('.webm') ||
    processedUrl.endsWith('.mov') ||
    processedUrl.startsWith('data:video')
  ) {
    return {
      type: 'direct',
      embedUrl: processedUrl,
      originalUrl: raw,
      isEmbedCode
    };
  }

  // 6. Generic iframe embed URL (https://...)
  if (
    (processedUrl.startsWith('https://') || processedUrl.startsWith('http://')) &&
    (processedUrl.includes('embed') || processedUrl.includes('player'))
  ) {
    return {
      type: 'iframe',
      embedUrl: processedUrl,
      originalUrl: raw,
      isEmbedCode
    };
  }

  return {
    type: 'invalid',
    embedUrl: processedUrl,
    originalUrl: raw,
    isEmbedCode
  };
}
