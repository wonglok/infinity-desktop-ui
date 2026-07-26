"use client";

import { useEffect, useRef } from "react";
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
    isMobile,
    setIsMobile,
    openWindow,
  } = useDesktopStore();

  // Restore persisted session on client mount — avoids SSR hydration mismatch
  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

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
      openWindow("appstore");
    }
  }, [isAuthenticated, openWindow]);

  // Wait until auth is hydrated before rendering anything
  if (!isHydrated) {
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
