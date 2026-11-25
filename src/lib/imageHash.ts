// Makes two "fingerprints" of a photo, in the browser, before it is uploaded:
//  exact  = the file's SHA-256 (finds the very same file uploaded again)
//  visual = a small 64-bit picture fingerprint (finds the same photo even if it was
//           resized, re-saved or screenshotted)
export async function hashImage(file: File): Promise<{ exact: string | null; visual: string | null }> {
  let exact: string | null = null;
  let visual: string | null = null;

  try {
    const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    exact = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    // ignored: the listing is still saved, just without this fingerprint
  }

  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = 9;
    canvas.height = 8;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(bitmap, 0, 0, 9, 8);
      bitmap.close?.();
      const px = ctx.getImageData(0, 0, 9, 8).data;
      const gray: number[] = [];
      for (let i = 0; i < px.length; i += 4) {
        gray.push(px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114);
      }
      let bits = "";
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          bits += gray[y * 9 + x] > gray[y * 9 + x + 1] ? "1" : "0";
        }
      }
      let hex = "";
      for (let i = 0; i < 64; i += 4) hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
      visual = hex;
    }
  } catch {
    // ignored
  }

  return { exact, visual };
}