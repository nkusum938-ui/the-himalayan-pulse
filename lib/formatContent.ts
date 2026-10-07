/**
 * Utility to format raw AI article markdown content for clean newspaper rendering.
 * - Replaces escaped newlines (\\n)
 * - Converts plain-text section titles (short lines without trailing punctuation followed by text) into ### H3 Markdown headers
 * - Ensures double-newline breaks between headings and paragraphs.
 */
export function formatArticleContent(rawContent: string): string {
  if (!rawContent) return "";

  let content = rawContent.replaceAll("\\n", "\n");

  // Split into lines to detect orphan heading lines missing '###'
  const lines = content.split("\n");
  const processedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      processedLines.push("");
      continue;
    }

    // Check if line looks like an unformatted heading:
    // Short length (< 80 chars), no ending punctuation (. : ? !), not already starting with # or ! or - or *
    const isAlreadyHeader = /^#{1,6}\s/.test(line);
    const isListItem = /^[\-*•\d+.]\s/.test(line);
    const isImage = /^!\[/.test(line);
    const endsWithPunctuation = /[.:?!]$/.test(line);

    if (
      !isAlreadyHeader &&
      !isListItem &&
      !isImage &&
      !endsWithPunctuation &&
      line.length > 3 &&
      line.length < 80
    ) {
      // Convert to H3 heading
      processedLines.push(`### ${line}`);
    } else {
      processedLines.push(line);
    }
  }

  // Join lines with double newlines if not already spaced
  let result = processedLines.join("\n");

  // Ensure double newlines between paragraphs & headers
  result = result.replace(/\n(?!\n)/g, "\n\n");

  return result;
}
