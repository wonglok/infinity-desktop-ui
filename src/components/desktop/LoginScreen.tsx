"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { Background } from "./Background";
import { UserIcon, GoogleIcon } from "./icons";

export function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center select-none">
      <Background />

      {/* Time / date */}
      <div className="absolute top-12 md:top-24 w-full text-center z-10 px-4">
        <div
          className="text-5xl sm:text-7xl md:text-8xl font-extralight tracking-tight"
          style={{ color: "#1d1a28" }}
        >
          <LiveClock />
        </div>
        <div className="mt-2 md:mt-3 text-[12px] md:text-[14px] font-light" style={{ color: "#5e5a70" }}>
          <LiveDate />
        </div>
      </div>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md mx-3 md:mx-4">
        <div
          className="rounded-[20px] md:rounded-[22px] overflow-hidden"
          style={{
            background: "rgba(255,255,252,0.64)",
            backdropFilter: "blur(32px) saturate(160%)",
            WebkitBackdropFilter: "blur(32px) saturate(160%)",
            boxShadow: "0 4px 40px rgba(80,60,100,0.10), 0 0 0 1px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.6)",
          }}
        >
          <div className="px-6 md:px-10 pt-8 md:pt-10 pb-6 md:pb-8">
            {/* Avatar */}
            <div className="flex justify-center mb-5 md:mb-6">
              <div
                className="flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-full text-white"
                style={{
                  background: "linear-gradient(135deg, rgba(124,111,212,0.65), rgba(160,140,220,0.5))",
                  boxShadow: "0 0 48px rgba(124,111,212,0.18), 0 0 0 1px rgba(255,255,255,0.6)",
                }}
              >
                <UserIcon className="w-8 h-8 md:w-10 md:h-10" />
              </div>
            </div>

            <h2 className="text-center text-lg md:text-xl font-medium tracking-wide mb-1 md:mb-1.5" style={{ color: "#1d1a28" }}>
              Welcome back
            </h2>
            <p className="text-center text-[12px] md:text-[14px] mb-6 md:mb-8" style={{ color: "#5e5a70" }}>
              Sign in to continue to your cloud
            </p>

            {/* Google Sign-In */}
            <button
              type="button"
              onClick={handleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 rounded-[14px] py-3 text-[14px] md:text-[15px] font-medium transition-all duration-200 touch-target"
              style={{
                background: "#fff",
                color: "#1d1a28",
                border: "1px solid rgba(0,0,0,0.12)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#fafafa"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.18)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)"; }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <GoogleIcon className="w-5 h-5" />
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </div>
        </div>

        <p className="mt-4 md:mt-5 text-center text-[12px] md:text-[13px] px-4" style={{ color: "#6b6680" }}>
          Infinity Cloud OS
        </p>
      </div>
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    function tick() { setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })); }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);
  return <>{time || "--:--"}</>;
}

function LiveDate() {
  const [date, setDate] = useState("");
  useEffect(() => {
    setDate(new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }));
  }, []);
  return <>{date}</>;
}
