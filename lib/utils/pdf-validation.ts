/**
 * Defensive PDF Binary Validation Utility
 * Adapted from E-LMS client-side defensive checks.
 * Validates Content-Type header and binary %PDF magic bytes (0x25 0x50 0x44 0x46).
 * Rejects corrupted HTML/JSON error payloads before rendering or downloading.
 */

export interface PdfValidationResult {
  isValid: boolean;
  error?: string;
}

export async function verifyPdfBlob(
  blob: Blob,
  contentType?: string | null
): Promise<PdfValidationResult> {
  if (!blob) {
    return { isValid: false, error: "No document data received from server." };
  }

  // 1. Inspect Content-Type header if available
  if (contentType) {
    const lowerType = contentType.toLowerCase();
    if (lowerType.includes("text/html")) {
      return {
        isValid: false,
        error: "Server returned an HTML error response instead of a valid PDF document.",
      };
    }
    if (lowerType.includes("application/json")) {
      try {
        const text = await blob.text();
        const json = JSON.parse(text);
        const errorMsg = json.message || json.error || "Server returned a JSON error response.";
        return { isValid: false, error: errorMsg };
      } catch {
        return {
          isValid: false,
          error: "Server returned a JSON error payload instead of a valid PDF document.",
        };
      }
    }
  }

  // 2. Check minimal viable PDF size
  if (blob.size < 4) {
    return { isValid: false, error: "Received an empty or truncated file (less than 4 bytes)." };
  }

  // 3. Inspect first 4 magic bytes: 0x25, 0x50, 0x44, 0x46 (%PDF)
  try {
    const slice = blob.slice(0, 4);
    const arrayBuffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const pdfSignature = [0x25, 0x50, 0x44, 0x46]; // %PDF

    const matchesSignature = pdfSignature.every((sigByte, idx) => bytes[idx] === sigByte);

    if (!matchesSignature) {
      // Analyze beginning of file to detect readable error payload
      const sample = await blob.slice(0, 512).text();
      if (sample.includes("<html") || sample.includes("<!DOCTYPE") || sample.includes("<body")) {
        return {
          isValid: false,
          error: "Server returned an HTML error page instead of a valid PDF document.",
        };
      }
      const trimmed = sample.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          const json = JSON.parse(trimmed);
          const msg = json.message || json.error || "Server error payload returned.";
          return { isValid: false, error: msg };
        } catch {
          // not fully parsed, fall through
        }
      }

      return {
        isValid: false,
        error: "File signature mismatch: File header does not match the standard %PDF specification.",
      };
    }

    return { isValid: true };
  } catch (err: any) {
    return { isValid: false, error: `Failed to inspect document binary signature: ${err.message}` };
  }
}
