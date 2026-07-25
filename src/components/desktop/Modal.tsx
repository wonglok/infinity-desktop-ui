"use client";

import { useEffect, useRef, useState } from "react";
import { useDesktopStore } from "./store";
import { CloseIcon } from "./icons";

export function Modal() {
  const { modal, closeModal, isMobile } = useDesktopStore();
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (modal.open && modal.type === "prompt") {
      setInputValue(modal.defaultValue ?? "");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [modal.open, modal.type, modal.defaultValue]);

  useEffect(() => {
    if (!modal.open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal(null);
      if (e.key === "Enter" && modal.type === "prompt") closeModal(inputValue);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [modal.open, modal.type, inputValue, closeModal]);

  if (!modal.open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.12)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)" }}
        onClick={() => closeModal(null)}
      />

      {/* Modal — frosted glass, light theme */}
      <div
        className={`relative z-10 w-full overflow-hidden ${isMobile ? "mx-3" : "max-w-sm"}`}
        style={{
          background: "rgba(255,255,252,0.82)",
          backdropFilter: "blur(32px) saturate(160%)",
          WebkitBackdropFilter: "blur(32px) saturate(160%)",
          borderRadius: isMobile ? 18 : 20,
          border: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 8px 48px rgba(80,60,100,0.14), 0 0 0 1px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
      >
        {/* Title */}
        <div className={`flex items-center justify-between ${isMobile ? "px-5 py-3.5" : "px-6 py-4"}`} style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 className="text-[17px] font-semibold" style={{ color: "#1d1a28" }}>{modal.title}</h3>
          <button
            onClick={() => closeModal(null)}
            className="flex h-7 w-7 items-center justify-center rounded-[10px] transition-colors"
            style={{ color: "rgba(0,0,0,0.30)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.06)"; e.currentTarget.style.color = "rgba(0,0,0,0.6)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(0,0,0,0.30)"; }}
          ><CloseIcon className="w-4 h-4" /></button>
        </div>

        {/* Body */}
        <div className={`${isMobile ? "px-5 py-4" : "px-6 py-5"}`}>
          <p className="text-[14px] leading-relaxed" style={{ color: "#3d3a4d" }}>{modal.message}</p>
          {modal.type === "prompt" && (
            <input ref={inputRef} type="text" value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={modal.placeholder}
              className="mt-4 w-full rounded-[14px] px-4 py-3 text-[14px] outline-none transition-all duration-200"
              style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.10)", color: "#1d1a28" }}
              onFocus={(e) => { e.target.style.borderColor = "rgba(124,111,212,0.4)"; e.target.style.background = "rgba(0,0,0,0.05)"; }}
              onBlur={(e) => { e.target.style.borderColor = "rgba(0,0,0,0.08)"; e.target.style.background = "rgba(0,0,0,0.03)"; }}
            />
          )}
        </div>

        {/* Actions */}
        <div className={`flex justify-end gap-2.5 ${isMobile ? "px-5 py-3.5" : "px-6 py-4"}`} style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          {modal.type === "confirm" || modal.type === "prompt" ? (
            <>
              <button onClick={() => closeModal(false)}
                className="rounded-[12px] px-5 py-2.5 text-[14px] transition-all duration-150"
                style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.10)", color: "#4a4658" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.07)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.04)")}
              >Cancel</button>
              <button onClick={() => closeModal(modal.type === "prompt" ? inputValue : true)}
                className="rounded-[12px] px-5 py-2.5 text-[14px] font-medium transition-all duration-150"
                style={{ background: "rgba(124,111,212,0.55)", color: "#fff" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(124,111,212,0.7)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(124,111,212,0.55)")}
              >{modal.type === "prompt" ? "OK" : "Confirm"}</button>
            </>
          ) : (
            <button onClick={() => closeModal(true)}
              className="rounded-[12px] px-5 py-2.5 text-[14px] font-medium transition-all duration-150"
              style={{ background: "rgba(124,111,212,0.55)", color: "#fff" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(124,111,212,0.7)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(124,111,212,0.55)")}
            >OK</button>
          )}
        </div>
      </div>
    </div>
  );
}
