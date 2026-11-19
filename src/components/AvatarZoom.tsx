"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { XIcon } from "./icons";

/**
 * A round profile photo that opens a larger view when clicked or tapped.
 *
 * - Works inside clickable cards: clicking the photo opens the viewer
 *   and does NOT open the card's link.
 * - Close it with the X button, a click outside the photo, or the Escape key.
 * - Only the first name is ever shown, matching the rest of the app.
 */
export default function AvatarZoom({
  src,
  name,
  size = 48,
  className = "",
}: {
  src: string;
  name?: string;
  size?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const firstName = (name || "").trim().split(" ")[0];

  function close() {
    setShown(false);
    setOpen(false);
  }

  function openViewer(e: React.SyntheticEvent) {
    // Stop the click from reaching a card link around the photo
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  }

  // Fade and scale in just after the viewer appears
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  // While open: lock page scrolling, listen for Escape, and put focus on the close button
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const trigger = triggerRef.current;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShown(false);
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open]);

  const viewer = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={firstName ? `${firstName}'s photo` : "Profile photo"}
      onClick={(e) => {
        e.stopPropagation();
        close();
      }}
      onKeyDown={(e) => e.stopPropagation()}
      className={`fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm transition-opacity duration-200 ${
        shown ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative transition duration-200 ${
          shown ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={firstName ? `${firstName}'s photo` : "Profile photo"}
          className="max-h-[80vh] max-w-[90vw] rounded-3xl object-contain shadow-2xl ring-4 ring-white/20"
        />
        {firstName && (
          <p className="mt-3 text-center text-sm font-semibold text-white">{firstName}</p>
        )}
        <button
          ref={closeRef}
          onClick={close}
          aria-label="Close photo"
          className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg transition hover:bg-slate-100"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <span
        ref={triggerRef}
        role="button"
        tabIndex={0}
        aria-label={firstName ? `View ${firstName}'s photo larger` : "View photo larger"}
        onClick={openViewer}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") openViewer(e);
        }}
        className="inline-flex shrink-0 cursor-zoom-in rounded-full transition hover:ring-4 hover:ring-brand-200 focus-visible:ring-4 focus-visible:ring-brand-300"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          style={{ width: size, height: size }}
          className={`rounded-full object-cover ${className}`}
        />
      </span>

      {/* Rendered on the page itself so a hovering card cannot clip or shift it */}
      {open && createPortal(viewer, document.body)}
    </>
  );
}
