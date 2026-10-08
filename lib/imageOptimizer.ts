import sharp from "sharp";

/**
 * Optimizes base64 or binary images for web performance:
 * - Resizes to max width 1200px (retaining aspect ratio)
 * - Converts to WebP format (quality 82)
 * - Drastically compresses payload size (typically 80% to 95% smaller)
 */
export async function optimizeImage(inputDataUrl: string): Promise<string> {
  try {
    // Extract base64 buffer from data URL or plain base64 string
    const base64Data = inputDataUrl.includes(",")
      ? inputDataUrl.split(",")[1]
      : inputDataUrl;

    const buffer = Buffer.from(base64Data, "base64");

    // Process with sharp
    const optimizedBuffer = await sharp(buffer)
      .resize({
        width: 1200,
        height: 1200,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();

    const optimizedBase64 = optimizedBuffer.toString("base64");
    return `data:image/webp;base64,${optimizedBase64}`;
  } catch (err) {
    console.error("[ImageOptimizer Error]", err);
    // Return original input if sharp fails or format is unsupported
    return inputDataUrl;
  }
}

/**
 * Generates SEO and GEO (Generative Engine Optimization) metadata for images
 */
export function generateGeoImageMetadata({
  title,
  entities = [],
  location,
}: {
  title: string;
  entities?: string[];
  location?: string;
}) {
  const primaryLocation = location || entities[0] || "Himalayan Region";
  const geoKeywords = entities.length > 0 ? entities.slice(0, 3).join(", ") : "Himalayan ecology & local community";

  const altText = `${title} — Editorial report on ${geoKeywords} in ${primaryLocation}`;
  const captionText = `Photo report from ${primaryLocation} — The Himalayan Pulse`;

  return {
    altText,
    captionText,
    primaryLocation,
    geoKeywords,
  };
}
