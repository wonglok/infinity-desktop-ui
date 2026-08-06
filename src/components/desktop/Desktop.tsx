"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useDesktopStore } from "./store";
import { Background } from "./Background";
import { Window } from "./Window";
import { Taskbar } from "./Taskbar";
import { DesktopIcon } from "./DesktopIcon";
import { Modal } from "./Modal";
import { LoginScreen } from "./LoginScreen";
import { AddAppModal } from "./AddAppModal";

const MOBILE_BP = 768;

export function Desktop() {
  const {
    windows,
    desktopIcons,
    closeStartMenu,
    isHydrated,
    isAuthenticated,
    hydrateAuth,
    setSession,
    hydrateDesktop,
    isMobile,
    setIsMobile,
    openWindow,
  } = useDesktopStore();

  // Read next-auth session
  const { data: session, status } = useSession();

  // Sync next-auth session → Zustand store + hydrate desktop state
  const hasHydratedDesktop = useRef(false);
  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && session?.user) {
      setSession({
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      });
      // Restore persisted windows & icon positions (once per mount)
      if (!hasHydratedDesktop.current) {
        hasHydratedDesktop.current = true;
        hydrateDesktop();
      }
    } else {
      // unauthenticated — fall back to legacy localStorage if present
      hydrateAuth();
    }
  }, [session, status, setSession, hydrateAuth, hydrateDesktop]);

  // Detect screen size — switches between desktop and mobile modes
  useEffect(() => {
    function check() {
      const mobile = window.innerWidth < MOBILE_BP;
      setIsMobile(mobile);
    }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [setIsMobile]);

  // Auto-start the AppStore after login (once per mount)
  const hasAutoStarted = useRef(false);
  useEffect(() => {
    if (isAuthenticated && !hasAutoStarted.current) {
      hasAutoStarted.current = true;

      if (process.env.NODE_ENV === "development") {
        openWindow("devapp");
      } else {
      }
    }
  }, [isAuthenticated, openWindow]);

  // Wait until auth is hydrated AND session is loaded before rendering
  if (!isHydrated || status === "loading") {
    return <div className="fixed inset-0" style={{ background: "#f7f5f8" }} />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="fixed inset-0 overflow-hidden select-none">
      <Background />

      {/* Desktop icon area — absolute positioned on desktop, grid on mobile */}
      <div
        className="absolute inset-0"
        style={{ bottom: isMobile ? 64 : 56 }}
        onClick={() => closeStartMenu()}
      >
        {isMobile ? (
          <div className="h-full overflow-y-auto px-4 py-6">
            <div className="grid grid-cols-4 gap-4 max-w-sm mx-auto">
              {desktopIcons.map((icon) => (
                <DesktopIcon key={icon.id} icon={icon} mobile />
              ))}
            </div>
          </div>
        ) : (
          desktopIcons.map((icon) => <DesktopIcon key={icon.id} icon={icon} />)
        )}
      </div>

      {windows.map((win) => (
        <Window key={win.id} window={win} />
      ))}

      <Taskbar />
      <Modal />
      <AddAppModal />
    </div>
  );
}
