"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useDesktopStore } from "./store";
import { Background } from "./Background";
import { Modal } from "./Modal";
import { EyeIcon, EyeOffIcon, UserIcon, GoogleIcon } from "./icons";

export function LoginScreen() {
  const { login, loginLoading, loginError, clearLoginError, showModal } =
    useDesktopStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);

  // Restore saved credentials on client mount (SSR-safe)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("infinity-auth");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.username) {
          setUsername(parsed.username);
          setRememberMe(true);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => usernameRef.current?.focus());
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loginLoading) return;
    await login(username, password, rememberMe);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      setGoogleLoading(false);
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
              Sign in to your cloud
            </p>

            {/* Error */}
            {loginError && (
              <div className="mb-5 rounded-[14px] px-4 py-3 text-[13px]"
                style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)", color: "#c41e1e" }}>
                {loginError}
              </div>
            )}

            {/* Google Sign-In */}
            <div className="mb-5">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loginLoading}
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
                {googleLoading ? (
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

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.08)" }} />
              <span className="text-[12px] font-medium" style={{ color: "#8c88a0" }}>or</span>
              <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.08)" }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5 md:space-y-4">
              <div>
                <label htmlFor="login-username" className="block text-[12px] font-medium mb-2" style={{ color: "#4a4658" }}>
                  Username
                </label>
                <input ref={usernameRef} id="login-username" type="text"
                  value={username} onChange={(e) => { setUsername(e.target.value); if (loginError) clearLoginError(); }}
                  placeholder="Your username" autoComplete="username"
                  className="w-full rounded-[14px] px-4 py-3 text-[15px] placeholder-black/15 outline-none transition-all duration-200"
                  style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.10)", color: "#1d1a28" }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(124,111,212,0.45)"; e.target.style.background = "rgba(0,0,0,0.05)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(0,0,0,0.10)"; e.target.style.background = "rgba(0,0,0,0.03)"; }}
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-[12px] font-medium mb-2" style={{ color: "#4a4658" }}>
                  Password
                </label>
                <div className="relative">
                  <input id="login-password" type={showPassword ? "text" : "password"}
                    value={password} onChange={(e) => { setPassword(e.target.value); if (loginError) clearLoginError(); }}
                    placeholder="Your password" autoComplete="current-password"
                    className="w-full rounded-[14px] px-4 py-3 pr-12 text-[15px] placeholder-black/15 outline-none transition-all duration-200"
                    style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.10)", color: "#1d1a28" }}
                    onFocus={(e) => { e.target.style.borderColor = "rgba(124,111,212,0.45)"; e.target.style.background = "rgba(0,0,0,0.05)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "rgba(0,0,0,0.10)"; e.target.style.background = "rgba(0,0,0,0.03)"; }}
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: "rgba(0,0,0,0.3)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(0,0,0,0.55)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(0,0,0,0.3)")}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[12px] md:text-[13px] pt-1 flex-wrap gap-y-2">
                <label className="flex items-center gap-2 cursor-pointer" style={{ color: "#4a4658" }}>
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded accent-[#7c6fd4] w-4 h-4" />
                  <span>Remember me</span>
                </label>
                <button type="button" className="transition-colors hover:opacity-80 font-medium" style={{ color: "#7c6fd4" }}
                  onClick={() => showModal("Reset password", "Enter your email and we'll send you a link.", "prompt", { placeholder: "you@example.com" })}
                >Forgot password?</button>
              </div>

              <button type="submit" disabled={loginLoading}
                className="w-full flex items-center justify-center gap-2.5 rounded-[14px] py-3 md:py-3 text-[14px] md:text-[15px] font-medium transition-all duration-200 mt-1 touch-target"
                style={loginLoading ? {
                  background: "rgba(124,111,212,0.25)", color: "rgba(255,255,255,0.7)", cursor: "wait",
                } : {
                  background: "rgba(124,111,212,0.65)", color: "#fff",
                  boxShadow: "0 4px 20px rgba(124,111,212,0.18)",
                }}
                onMouseEnter={(e) => { if (!loginLoading) e.currentTarget.style.background = "rgba(124,111,212,0.82)"; }}
                onMouseLeave={(e) => { if (!loginLoading) e.currentTarget.style.background = "rgba(124,111,212,0.65)"; }}
              >
                {loginLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Signing in…</span>
                  </>
                ) : ("Sign in")}
              </button>
            </form>
          </div>
        </div>

        <p className="mt-4 md:mt-5 text-center text-[12px] md:text-[13px] px-4" style={{ color: "#6b6680" }}>
          Press Enter to submit · Any credentials (min. 2 characters)
        </p>
      </div>

      <Modal />
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
