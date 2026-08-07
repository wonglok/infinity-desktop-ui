"use client";

import { useEffect, useRef, useState } from "react";
import { useDesktopStore } from "./store";
import { getIcon, CloseIcon } from "./icons";

// ── Curated icon keys suitable for app tiles ────────────────────────────────

const APP_ICON_KEYS = [
  "folder",
  "globe",
  "gear",
  "monitor",
  "home",
  "document",
  "image",
  "music",
  "video",
  "palette",
  "storage",
  "lock",
  "bell",
  "download",
  "wifi",
] as const;

// ── Component ────────────────────────────────────────────────────────────────

export function AddAppModal() {
  const {
    addRemoteApp,
    isMobile,
    addAppModalOpen: open,
    closeAddAppModal: onClose,
  } = useDesktopStore();

  const [name, setName] = useState("");
  const [origin, setOrigin] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<string>("monitor");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<() => Promise<void>>(async () => {});

  // Focus name input on open + reset form
  useEffect(() => {
    if (open) {
      setName("");
      setOrigin("");
      setSelectedIcon("monitor");
      setError(null);
      setSubmitting(false);
      requestAnimationFrame(() => nameRef.current?.focus());
    }
  }, [open]);

  // ESC key to close, Enter to submit
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Enter") submitRef.current();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async () => {
    // Basic validation
    const trimmedName = name.trim();
    let trimmedOrigin = origin.trim();

    if (!trimmedName) {
      setError("App name is required.");
      nameRef.current?.focus();
      return;
    }

    if (!trimmedOrigin) {
      setError("App link (origin URL) is required.");
      return;
    }

    // Auto-prepend https:// if no protocol
    if (!/^https?:\/\//i.test(trimmedOrigin)) {
      trimmedOrigin = `https://${trimmedOrigin}`;
    }

    // Basic URL validation
    try {
      new URL(trimmedOrigin);
    } catch {
      setError("Please enter a valid URL (e.g., https://example.com).");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      addRemoteApp({
        name: trimmedName,
        icon: selectedIcon,
        origin: trimmedOrigin,
      });
      onClose();
    } catch {
      setError("Failed to add app. Please try again.");
      setSubmitting(false);
    }
  };
  submitRef.current = handleSubmit;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(0,0,0,0.12)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
        }}
        onClick={onClose}
      />

      {/* Modal — frosted glass, matching existing Modal style */}
      <div
        className={`relative z-10 w-full overflow-hidden ${
          isMobile ? "mx-3" : "max-w-md"
        }`}
        style={{
          background: "rgba(255,255,252,0.82)",
          backdropFilter: "blur(32px) saturate(160%)",
          WebkitBackdropFilter: "blur(32px) saturate(160%)",
          borderRadius: isMobile ? 18 : 20,
          border: "1px solid rgba(0,0,0,0.07)",
          boxShadow:
            "0 8px 48px rgba(80,60,100,0.14), 0 0 0 1px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
      >
        {/* Title bar */}
        <div
          className={`flex items-center justify-between ${
            isMobile ? "px-5 py-3.5" : "px-6 py-4"
          }`}
          style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
        >
          <h3
            className="text-[17px] font-semibold"
            style={{ color: "#1d1a28" }}
          >
            Add Remote App
          </h3>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-[10px] transition-colors"
            style={{ color: "rgba(0,0,0,0.30)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0,0,0,0.06)";
              e.currentTarget.style.color = "rgba(0,0,0,0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(0,0,0,0.30)";
            }}
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className={`${isMobile ? "px-5 py-4" : "px-6 py-5"}`}>
          {/* App Name */}
          <label
            className="block text-[13px] font-medium mb-1.5"
            style={{ color: "#4a4658" }}
          >
            App Name
          </label>
          <input
            ref={nameRef}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="My App"
            className="w-full rounded-[14px] px-4 py-3 text-[14px] outline-none transition-all duration-200 mb-4"
            style={{
              background: "rgba(0,0,0,0.03)",
              border: "1px solid rgba(0,0,0,0.10)",
              color: "#1d1a28",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "rgba(124,111,212,0.4)";
              e.target.style.background = "rgba(0,0,0,0.05)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(0,0,0,0.08)";
              e.target.style.background = "rgba(0,0,0,0.03)";
            }}
          />

          {/* App Link (Origin URL) */}
          <label
            className="block text-[13px] font-medium mb-1.5"
            style={{ color: "#4a4658" }}
          >
            App Link (Origin URL)
          </label>
          <input
            type="text"
            value={origin}
            onChange={(e) => {
              setOrigin(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="https://infinity-widget.vercel.app"
            className="w-full rounded-[14px] px-4 py-3 text-[14px] outline-none transition-all duration-200 mb-5"
            style={{
              background: "rgba(0,0,0,0.03)",
              border: "1px solid rgba(0,0,0,0.10)",
              color: "#1d1a28",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "rgba(124,111,212,0.4)";
              e.target.style.background = "rgba(0,0,0,0.05)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(0,0,0,0.08)";
              e.target.style.background = "rgba(0,0,0,0.03)";
            }}
          />

          {/* Icon Picker */}
          <label
            className="block text-[13px] font-medium mb-2"
            style={{ color: "#4a4658" }}
          >
            Choose Icon
          </label>
          <div
            className="grid grid-cols-8 gap-2 p-2.5 rounded-[14px]"
            style={{
              background: "rgba(0,0,0,0.02)",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            {APP_ICON_KEYS.map((key) => {
              const IconComponent = getIcon(key);
              const isSelected = selectedIcon === key;
              return (
                <button
                  key={key}
                  type="button"
                  className="flex items-center justify-center rounded-[12px] transition-all duration-150 aspect-square"
                  style={{
                    background: isSelected
                      ? "rgba(124,111,212,0.18)"
                      : "transparent",
                    boxShadow: isSelected
                      ? "0 0 0 1.5px rgba(124,111,212,0.45)"
                      : "none",
                    color: isSelected ? "#5b4db0" : "rgba(0,0,0,0.40)",
                  }}
                  onClick={() => setSelectedIcon(key)}
                  title={key}
                >
                  <IconComponent
                    className={isSelected ? "w-5 h-5" : "w-4.5 h-4.5"}
                  />
                </button>
              );
            })}
          </div>

          {/* Error */}
          {error && (
            <p
              className="mt-4 text-[13px] leading-relaxed"
              style={{ color: "#d94a4a" }}
            >
              {error}
            </p>
          )}
        </div>

        {/* Actions */}
        <div
          className={`flex justify-end gap-2.5 ${
            isMobile ? "px-5 py-3.5" : "px-6 py-4"
          }`}
          style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
        >
          <button
            onClick={onClose}
            className="rounded-[12px] px-5 py-2.5 text-[14px] transition-all duration-150"
            style={{
              background: "rgba(0,0,0,0.04)",
              border: "1px solid rgba(0,0,0,0.10)",
              color: "#4a4658",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(0,0,0,0.07)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(0,0,0,0.04)")
            }
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-[12px] px-5 py-2.5 text-[14px] font-medium transition-all duration-150 disabled:opacity-50"
            style={{
              background: "rgba(124,111,212,0.55)",
              color: "#fff",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(124,111,212,0.7)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(124,111,212,0.55)")
            }
          >
            {submitting ? "Adding…" : "Add App"}
          </button>
        </div>
      </div>
    </div>
  );
}
