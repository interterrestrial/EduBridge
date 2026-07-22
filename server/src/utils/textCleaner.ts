export function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\x00/g, '') // remove null bytes
    .replace(/\r\n/g, '\n') // normalize line breaks
    .replace(/[ \t]+/g, ' ') // collapse horizontal spaces
    .replace(/\n{3,}/g, '\n\n') // collapse multiple blank lines
    .trim();
}
