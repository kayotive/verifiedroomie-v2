"use client";

import { useEffect, useRef, useState } from "react";

const MAX_SIDE = 1280;

// Shrinks a photo so big phone pictures stay small and don't fail to upload
async function shrink(blob: Blob): Promise<File> {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const out = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No image"))), "image/jpeg", 0.85)
  );
  return new File([out], "profile.jpg", { type: "image/jpeg" });
}

const buttonClass =
  "cursor-pointer rounded-xl border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50";

export default function PhotoPicker({
  onFile,
  onError,
}: {
  onFile: (file: File) => void;
  onError: (message: string) => void;
}) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [camError, setCamError] = useState("");
  const [busy, setBusy] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fallbackRef = useRef<HTMLInputElement>(null);

  // Open the camera inside the page, so the person never leaves the app
  useEffect(() => {
    if (!cameraOpen) return;
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch {
        setCamError(
          "We could not open the camera. Please allow camera access, or choose a photo from your gallery."
        );
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [cameraOpen]);

  function openCamera() {
    setCamError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      // Older browsers: use the phone's camera app instead
      fallbackRef.current?.click();
      return;
    }
    setCameraOpen(true);
  }

  function snap() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    setBusy(true);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setBusy(false);
          return;
        }
        try {
          onFile(await shrink(blob));
        } catch {
          onFile(new File([blob], "profile.jpg", { type: "image/jpeg" }));
        }
        setBusy(false);
        setCameraOpen(false);
      },
      "image/jpeg",
      0.9
    );
  }

  async function onPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      onError("Please choose an image file.");
      return;
    }
    try {
      onFile(await shrink(f));
    } catch {
      onFile(f);
    }
  }

  return (
    <>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" onClick={openCamera} className={buttonClass}>
          📷 Take a photo
        </button>
        <label className={buttonClass}>
          🖼️ Choose from gallery
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onPicked}
            className="hidden"
          />
        </label>
        <input
          ref={fallbackRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="user"
          onChange={onPicked}
          className="hidden"
        />
      </div>
      <p className="max-w-xs text-center text-xs text-gray-500">
        Use a clear photo of yourself, taken with your camera or picked from your gallery. Photos of
        houses, objects, documents or text (including phone numbers) aren&apos;t allowed, and your
        profile may be suspended.
      </p>

      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/85 p-4">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="max-h-[65vh] w-full max-w-sm rounded-2xl bg-black object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
          {camError && <p className="max-w-sm text-center text-sm text-white">{camError}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={snap}
              disabled={busy || !!camError}
              className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {busy ? "Saving..." : "Take photo"}
            </button>
            <button
              type="button"
              onClick={() => setCameraOpen(false)}
              className="rounded-xl border border-white/60 px-6 py-3 font-semibold text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}