/**
 * Resolves a visual asset path (local, imported, or user-defined string)
 * into a production-safe served asset URL.
 * All assets are served dynamically from the local /public/ directory or remote URLs.
 */

export type AssetContext = "event" | "set" | "bio" | "video" | "photo" | "sponsor" | "hero" | "logo" | "default";

export const getContextualFallback = (context: AssetContext = "default"): string => {
  switch (context) {
    case "event":
      return "/fotos/trewa4.jpg";
    case "set":
      return "/fotosportadas/guestsessionportada.jpeg";
    case "bio":
      return "/fotos/trewa9.jpg";
    case "video":
      return "/fotos/djing.jpg";
    case "photo":
      return "/fotos/sunset1.jpeg";
    case "sponsor":
    case "logo":
      return "/logosonicaradio.png";
    case "hero":
    default:
      return "/fotos/hero.jpg";
  }
};

export const resolveImage = (src: string | undefined | null, context: AssetContext = "default"): string => {
  if (!src || typeof src !== "string" || src.trim() === "") {
    return getContextualFallback(context);
  }
  
  if (src.startsWith("data:") || src.startsWith("blob:") || src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }
  
  // Standardize backslashes
  let cleaned = src.replace(/\\/g, "/").trim();
  cleaned = cleaned.replace(/^\/+/g, "/");
  
  if (cleaned.startsWith("src/")) {
    cleaned = "/" + cleaned.substring(4);
  } else if (!cleaned.startsWith("/")) {
    cleaned = "/" + cleaned;
  }

  cleaned = cleaned.replace(/\/\/+/g, "/");
  return cleaned;
};

export const resolveVideo = (src: string | undefined | null): string => {
  if (!src || typeof src !== "string" || src.trim() === "") {
    return "/videos/videoiniciohero.mp4";
  }
  if (src.startsWith("data:") || src.startsWith("blob:") || src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }
  
  let cleaned = src.replace(/\\/g, "/").trim();
  cleaned = cleaned.replace(/^\/+/g, "/");
  
  if (cleaned.startsWith("src/")) {
    cleaned = "/" + cleaned.substring(4);
  } else if (!cleaned.startsWith("/")) {
    cleaned = "/" + cleaned;
  }
  
  cleaned = cleaned.replace(/\/\/+/g, "/");
  return cleaned;
};

